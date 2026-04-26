import Stripe from 'stripe';
import config from '../../../config';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import emailSender from '../../../shared/emailSender';
import { welcomeEmailTemplate } from '../../../helpars/template/welcomeEmailTemplate';

// const stripe = new Stripe(config.stripe.secret_key as string, {
//     apiVersion: '2025-07-30.basil   as any,
// });


const stripe = new Stripe(config.stripe.secret_key as string, {
    apiVersion: '2024-06-20' as any,
});

/**
 * Helper to get or create a Stripe Price object for a given plan and duration.
 */
const getOrCreateStripePrice = async (plan: any, duration: 'Monthly' | 'Annually') => {
    const priceOption = plan.prices.find((p: any) => p.duration === duration);
    if (!priceOption) {
        throw new ApiError(400, `Price option for ${duration} not found in this plan`);
    }

    const lookupKey = `plan_${plan.id}_${duration.toLowerCase()}`;
    const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        limit: 1
    });

    if (prices.data.length > 0) {
        const stripePriceId = prices.data[0].id;
        const productId = prices.data[0].product as string;

        if (!prices.data[0].active) {
            await stripe.prices.update(stripePriceId, { active: true });
        }

        const product = await stripe.products.retrieve(productId);
        if (!product.active) {
            await stripe.products.update(productId, { active: true });
        }

        if (!prices.data[0].active || !product.active) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return stripePriceId;
    } else {
        const product = await stripe.products.create({
            name: `${plan.name} (${duration})`,
            description: plan.features.join(', ').substring(0, 250),
            metadata: { planId: plan.id, duration }
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(priceOption.price * 100),
            currency: 'usd',
            recurring: {
                interval: duration === 'Annually' ? 'year' : 'month',
            },
            lookup_key: lookupKey
        });
        return price.id;
    }
};

/**
 * Creates a Stripe Subscription (Incomplete) and returns the client_secret 
 * so the frontend can confirm the payment using Stripe Elements.
 */
const createSubscriptionIntent = async (userId: string, planId: string, duration: 'Monthly' | 'Annually') => {
    // 1. Fetch User
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Ensure email is verified before proceeding to payment
    if (!user.isVerifyEmail) {
        throw new ApiError(400, 'Please verify your email address before purchasing a subscription.');
    }

    // 2. Fetch Subscription Plan
    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
    });

    if (!plan) {
        throw new ApiError(404, 'Subscription plan not found');
    }

    if (!plan.isActive) {
        throw new ApiError(400, 'This plan is currently not active');
    }

    // Find the price for the requested duration
    const priceOption = plan.prices.find(p => p.duration === duration);
    if (!priceOption) {
        throw new ApiError(400, `Price option for ${duration} not found in this plan`);
    }

    // 3. Ensure User is a Stripe Customer (Only if needed for payment)
    const isProfessional = plan.category === 'PROFESSIONAL';
    const isEligibleForTrial = !user.isTrialUsed && isProfessional;

    // 3. Prevent Double Subscriptions
    const existingSub = await prisma.userPlanSubscription.findFirst({
        where: { ownerId: user.id, status: { in: ['active', 'trialing'] } },
    });

    if (existingSub) {
        throw new ApiError(400, "You already have an active subscription. Please use the 'Change Plan' option to upgrade or modify your plan.");
    }

    // --- PROCEED WITH STRIPE PAYMENT/TRIAL FLOW ---
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        try {
            const customer = await stripe.customers.create({
                email: user.email as string,
                metadata: {
                    userId: user.id,
                },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
            console.log("Stripe Customer Created:", customerId);
        } catch (err: any) {
            console.error("Stripe Customer Creation Failed:", err);
            throw new ApiError(500, `Failed to create Stripe customer: ${err.message}`);
        }
    }

    // 5. Handle Stripe Products/Prices dynamically
    const stripePriceId = await getOrCreateStripePrice(plan, duration);

    // 6. Create NEW Subscription
    let subscription;
    try {
        subscription = await stripe.subscriptions.create({
            customer: customerId as string,
            items: [{ price: stripePriceId }],
            description: `Subscription for ${plan.name} (${duration}) - User: ${user.email}`,
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            trial_period_days: isEligibleForTrial ? 14 : undefined,
            expand: ['latest_invoice', 'latest_invoice.payment_intent', 'pending_setup_intent'],
            metadata: {
                userId: user.id,
                planId: plan.id,
                duration,
                isTrialAttempt: isEligibleForTrial ? 'true' : 'false'
            }
        });
        console.log("Stripe Subscription Created:", subscription.id);
    } catch (err: any) {
        console.error("Stripe Subscription Creation Failed:", err);
        throw new ApiError(500, `Failed to create Stripe subscription: ${err.message}`);
    }

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
    const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;

    // For trials: Stripe uses SetupIntent (no charge), for paid plans: PaymentIntent
    const clientSecret = paymentIntent?.client_secret || setupIntent?.client_secret || null;

    console.log("Stripe Intent Debug:", {
        invoiceId: invoice?.id,
        paymentIntentId: paymentIntent?.id,
        setupIntentId: setupIntent?.id,
        hasClientSecret: !!clientSecret,
        subscriptionStatus: subscription.status
    });

    if (!clientSecret) {
        console.error("CRITICAL: clientSecret is NULL. Invoice ID:", invoice?.id);
    }


    // 7. Create NEW Payment record in DB with duration tracking
    const paymentRecord = await prisma.payment.create({
        data: {
            userId: user.id,
            planId: plan.id,
            amount: isEligibleForTrial ? 0 : priceOption.price,
            planPrice: priceOption.price, // Save the actual plan price even for trials
            duration: duration,
            status: 'PENDING',
            transactionId: paymentIntent?.id || setupIntent?.id || `SUB_${subscription.id}`,
            invoiceId: invoice?.id || null,
            subscriptionId: subscription.id
        }
    });

    return {
        trialStarted: isEligibleForTrial,
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        orderId: paymentRecord.id,
        message: isEligibleForTrial 
            ? 'Setup your card to start 14-day free trial'
            : 'Payment intent created successfully'
    };
};

const handleWebhook = async (payload: string, sig: string) => {
    let event;

    try {
        if (!sig && config.env === 'development') {
            console.warn("Stripe signature missing. Bypassing verification for Postman testing in development.");
            // In development, if no signature is provided, parse the payload directly
            event = typeof payload === 'string' ? JSON.parse(payload) : payload;
        } else {
            event = stripe.webhooks.constructEvent(
                payload,
                sig,
                config.stripe.webhook_secret as string
            );
        }
    } catch (err: any) {
        throw new Error(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'invoice.payment_succeeded':
            const invoice = event.data.object as Stripe.Invoice;
            const subId = invoice.subscription as string;
            const paymentIntentId = invoice.payment_intent as string;

            if (subId) {
                const subscription = await stripe.subscriptions.retrieve(subId);
                const expiresAt = new Date(subscription.current_period_end * 1000);

                const planId = subscription.metadata.planId;
                const userId = subscription.metadata.userId;
                const duration = subscription.metadata.duration as any;

                // Fetch plan to get the original price
                const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
                const planPrice = plan?.prices.find(p => p.duration === duration)?.price || 0;

                // 1. Update or Create Payment record for billing history
                const amountPaid = (invoice.amount_paid / 100);
                
                // Check if we already have a record for this invoice
                const existingPayment = await prisma.payment.findFirst({
                    where: { 
                        OR: [
                            { invoiceId: invoice.id },
                            { transactionId: paymentIntentId }
                        ]
                    }
                });

                if (existingPayment) {
                    await prisma.payment.update({
                        where: { id: existingPayment.id },
                        data: {
                            status: 'PAID',
                            invoiceId: invoice.id,
                            transactionId: paymentIntentId
                        }
                    });
                } else {
                    // Create NEW Payment record for recurring renewal
                    await prisma.payment.create({
                        data: {
                            userId: userId,
                            planId: planId,
                            amount: amountPaid,
                            planPrice: planPrice, // Store the original plan price
                            duration: duration,
                            status: 'PAID',
                            transactionId: paymentIntentId,
                            invoiceId: invoice.id,
                            subscriptionId: subId
                        }
                    });
                }

                // 2. ENFORCE SINGLE ACTIVE PLAN: Deactivate all EXISTING subscriptions
                await prisma.userPlanSubscription.updateMany({
                    where: { 
                        ownerId: userId, 
                        stripeSubscriptionId: { not: subId }
                    },
                    data: { status: 'canceled' }
                });

                // 3. Create or Update UserPlanSubscription Bucket
                const isTrial = subscription.status === 'trialing';

                await prisma.userPlanSubscription.upsert({
                    where: { stripeSubscriptionId: subId },
                    update: {
                        status: subscription.status as any,
                        expiresAt: expiresAt,
                        duration: duration, 
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        autoRenew: !subscription.cancel_at_period_end
                    },
                    create: {
                        ownerId: userId,
                        planId: planId,
                        duration: duration,
                        stripeSubscriptionId: subId,
                        expiresAt: expiresAt,
                        status: subscription.status as any,
                        autoRenew: !subscription.cancel_at_period_end,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end
                    }
                });

                // Update User model to track trial usage
                if (isTrial || subscription.metadata.isTrialAttempt === 'true') {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { isTrialUsed: true }
                    });
                }

                // Global user status update
                // Smart Update: Only push the date forward if new expiry is later
                const user = await prisma.user.findUnique({ where: { id: userId } });
                const shouldUpdateDate = !user?.subscriptionExpiresAt || expiresAt > user.subscriptionExpiresAt;

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isSubscribed: true,
                        ...(shouldUpdateDate && {
                            planId: planId,
                            subscriptionExpiresAt: expiresAt,
                        })
                    },
                });

                // Send Welcome Email for first-time subscription/trial
                console.log(`[WEBHOOK] Attempting to send welcome email to: ${userId}`);
                const userForEmail = await prisma.user.findUnique({ where: { id: userId } });
                if (userForEmail && userForEmail.email) {
                    try {
                        const html = welcomeEmailTemplate(userForEmail.fullName || "Valued Owner");
                        await emailSender(userForEmail.email, html, "Welcome to SmartAutoTech!");
                        console.log(`[WEBHOOK] Welcome email sent to ${userForEmail.email}`);
                    } catch (error) {
                        console.error("[WEBHOOK] Failed to send welcome email:", error);
                    }
                } else {
                    console.log(`[WEBHOOK] Skip welcome email: User or Email not found. User found: ${!!userForEmail}`);
                }
            }
            break;

        case 'customer.subscription.deleted':
            const subDeleted = event.data.object as Stripe.Subscription;
            await prisma.userPlanSubscription.updateMany({
                where: { stripeSubscriptionId: subDeleted.id },
                data: { status: 'canceled' }
            });

            // If no more active/trialing subs, mark user as not subscribed
            const ownerDelId = subDeleted.metadata.userId;
            const activeSubsCount = await prisma.userPlanSubscription.count({
                where: { ownerId: ownerDelId, status: { in: ['active', 'trialing'] } }
            });

            if (activeSubsCount === 0) {
                await prisma.user.update({
                    where: { id: ownerDelId },
                    data: { isSubscribed: false }
                });
            }
            break;

        case 'customer.subscription.updated':
            const subUpdated = event.data.object as Stripe.Subscription;
            const subUpStatus = subUpdated.status;
            const subUpId = subUpdated.id;
            const subUpExpiresAt = new Date(subUpdated.current_period_end * 1000);

            await prisma.userPlanSubscription.update({
                where: { stripeSubscriptionId: subUpId },
                data: {
                    status: subUpStatus as any,
                    expiresAt: subUpExpiresAt,
                    cancelAtPeriodEnd: subUpdated.cancel_at_period_end,
                    autoRenew: !subUpdated.cancel_at_period_end
                }
            });

            // Sync global user subscribed status and plan details
            const ownerUpId = subUpdated.metadata.userId;
            const subUpPlanId = subUpdated.metadata.planId;
            const subUpDuration = subUpdated.metadata.duration;

            const hasAccessSubs = await prisma.userPlanSubscription.count({
                where: { ownerId: ownerUpId, status: { in: ['active', 'trialing'] } }
            });

            await prisma.user.update({
                where: { id: ownerUpId },
                data: { 
                    isSubscribed: hasAccessSubs > 0,
                    subscriptionExpiresAt: subUpExpiresAt,
                    ...(subUpPlanId && { planId: subUpPlanId })
                }
            });

            // Sync UserPlanSubscription record
            await prisma.userPlanSubscription.updateMany({
                where: { stripeSubscriptionId: subUpId },
                data: {
                    status: subUpStatus as any,
                    expiresAt: subUpExpiresAt,
                    cancelAtPeriodEnd: subUpdated.cancel_at_period_end,
                    autoRenew: !subUpdated.cancel_at_period_end,
                    ...(subUpPlanId && { planId: subUpPlanId }),
                    ...(subUpDuration && { duration: subUpDuration as any })
                }
            });
            break;


        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
};

const confirmPayment = async (paymentId: string, paymentIntentId: string) => {
    let status = "";
    if (paymentIntentId.startsWith("seti_")) {
        const setupIntent = await stripe.setupIntents.retrieve(paymentIntentId);
        status = setupIntent.status;
    } else {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        status = paymentIntent.status;
    }

    if (status !== "succeeded") {
        throw new ApiError(400, `Payment not confirmed. Stripe status: ${status}`);
    }

    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { plan: true }
    });

    if (!payment) {
        throw new ApiError(404, "Payment record not found");
    }

    if (payment.status === 'PAID') {
        return { message: "Payment already confirmed", payment };
    }

    const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID' }
    });

    // 2. ENFORCE SINGLE ACTIVE PLAN: Deactivate all EXISTING subscriptions 
    await prisma.userPlanSubscription.updateMany({
        where: { 
            ownerId: payment.userId, 
            stripeSubscriptionId: { not: payment.subscriptionId }
        },
        data: { status: 'canceled' }
    });

    // 3. Sync with Stripe Subscription Data
    const stripeSub = payment.subscriptionId ? await stripe.subscriptions.retrieve(payment.subscriptionId) : null;
    const finalStatus = stripeSub ? stripeSub.status : 'active';
    
    // Authortative expiration date from Stripe
    const expiresAt = stripeSub 
        ? new Date(stripeSub.current_period_end * 1000) 
        : (() => {
            const d = new Date();
            if (payment.duration === 'Annually') d.setFullYear(d.getFullYear() + 1);
            else d.setMonth(d.getMonth() + 1);
            return d;
        })();

    await prisma.userPlanSubscription.upsert({
        where: { stripeSubscriptionId: payment.subscriptionId || "UNKNOWN" },
        update: {
            status: finalStatus as any,
            expiresAt: expiresAt,
        },
        create: {
            ownerId: payment.userId,
            planId: payment.planId,
            duration: payment.duration as any,
            stripeSubscriptionId: payment.subscriptionId,
            expiresAt: expiresAt,
            status: finalStatus as any
        }
    });

    // Mark trial as used if it was a trial setup
    if (finalStatus === 'trialing' || (stripeSub && stripeSub.metadata.isTrialAttempt === 'true')) {
        await prisma.user.update({
            where: { id: payment.userId },
            data: { isTrialUsed: true }
        });
    }

    // Smart Update: Only push the date forward if new expiry is later
    const user = await prisma.user.findUnique({ where: { id: payment.userId } });
    const shouldUpdateDate = !user?.subscriptionExpiresAt || expiresAt > user.subscriptionExpiresAt;

    await prisma.user.update({
        where: { id: payment.userId },
        data: {
            isSubscribed: true,
            ...(shouldUpdateDate && {
                planId: payment.planId,
                subscriptionExpiresAt: expiresAt,
            })
        },
    });

    // Send Welcome Email for first-time subscription/trial
    console.log(`[CONFIRM_PAYMENT] Attempting to send welcome email to: ${payment.userId}`);
    if (user && user.email) {
        try {
            const html = welcomeEmailTemplate(user.fullName || "Valued Owner");
            await emailSender(user.email, html, "SmartAutoTech");
            console.log(`[CONFIRM_PAYMENT] Welcome email sent to ${user.email}`);
        } catch (error) {
            console.error("[CONFIRM_PAYMENT] Failed to send welcome email:", error);
        }
    } else {
        console.log(`[CONFIRM_PAYMENT] Skip welcome email: User or Email not found. User found: ${!!user}`);
    }

    return updatedPayment;
};

const cancelRenewal = async (userId: string, subscriptionId: string) => {
    const sub = await prisma.userPlanSubscription.findFirst({
        where: { id: subscriptionId, ownerId: userId }
    });

    if (!sub || !sub.stripeSubscriptionId) {
        throw new ApiError(404, "Active subscription not found");
    }

    const stripeSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true
    });

    await prisma.userPlanSubscription.update({
        where: { id: subscriptionId },
        data: {
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            autoRenew: !stripeSub.cancel_at_period_end
        }
    });

    return { message: "Auto-renewal turned off. Plan will expire at end of period.", data: stripeSub };
};

const resumeRenewal = async (userId: string, subscriptionId: string) => {
    const sub = await prisma.userPlanSubscription.findFirst({
        where: { id: subscriptionId, ownerId: userId }
    });

    if (!sub || !sub.stripeSubscriptionId) {
        throw new ApiError(404, "Subscription not found");
    }

    const stripeSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: false
    });

    await prisma.userPlanSubscription.update({
        where: { id: subscriptionId },
        data: {
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            autoRenew: !stripeSub.cancel_at_period_end
        }
    });

    return { message: "Auto-renewal resumed successfully.", data: stripeSub };
};

const getMySubscriptions = async (userId: string) => {
    return await prisma.userPlanSubscription.findMany({
        where: { ownerId: userId, status: { in: ['active', 'trialing'] } },
        include: { plan: true }
    });
};


const changeSubscriptionPlan = async (
    userId: string, 
    subscriptionId: string, 
    newPlanId: string, 
    newDuration: 'Monthly' | 'Annually',
    technicianIds?: string[] // Manually selected technicians for downgrades
) => {
    // 1. Fetch Current Subscription from DB
    const currentSub = await prisma.userPlanSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
    });

    if (!currentSub || currentSub.ownerId !== userId || !['active', 'trialing'].includes(currentSub.status)) {
        throw new ApiError(404, "Active or trialing subscription not found");
    }

    if (currentSub.planId === newPlanId && currentSub.duration === newDuration) {
        throw new ApiError(400, `You are already subscribed to the ${currentSub.plan.name} ${newDuration} plan.`);
    }

    if (!currentSub.stripeSubscriptionId) {
        throw new ApiError(400, "This subscription is not managed by Stripe (e.g., Trial). Please purchase a new plan instead.");
    }

    // 2. Fetch New Plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId }
    });

    if (!newPlan || !newPlan.isActive) {
        throw new ApiError(404, "New active plan not found");
    }

    // 3. Handle Technician Carry-over / Selection for Downgrades
    let finalTechnicianIds = currentSub.technicianIds;
    const isDowngrade = newPlan.technicianLimit < currentSub.technicianIds.length;

    if (isDowngrade) {
        if (!technicianIds || technicianIds.length === 0) {
            throw new ApiError(400, `The new plan has a limit of ${newPlan.technicianLimit} technicians. Please select which technicians to keep.`);
        }
        if (technicianIds.length > newPlan.technicianLimit) {
            throw new ApiError(400, `Selection exceeds the new plan limit of ${newPlan.technicianLimit}.`);
        }
        
        // Verify provided IDs belong to the current list
        const isValidSelection = technicianIds.every(id => currentSub.technicianIds.includes(id));
        if (!isValidSelection) {
            throw new ApiError(400, "Some selected technicians were not part of your current plan.");
        }
        
        finalTechnicianIds = technicianIds;
    }

    // 4. Get New Price ID from Stripe
    const newPriceId = await getOrCreateStripePrice(newPlan, newDuration);

    // 5. Retrieve Subscription from Stripe to find Item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId);
    const itemId = stripeSubscription.items.data[0].id;

    // 6. Update Stripe Subscription with Proration
    const updatedStripeSub = await stripe.subscriptions.update(currentSub.stripeSubscriptionId, {
        items: [{
            id: itemId,
            price: newPriceId,
        }],
        proration_behavior: 'always_invoice', // Immediately charge/credit the difference
        cancel_at_period_end: false, // Automatically resume renewal if they change plans
        metadata: {
            userId: userId,
            planId: newPlanId,
            duration: newDuration
        }
    });

    // 7. Update Database
    const expiresAt = new Date(updatedStripeSub.current_period_end * 1000);

    // To keep the single active plan logic and clean history, 
    // we deactivate the old bucket and create a new one (or just update the current)
    // Updating current is easier for the user to manage their existing technician lists
    const updatedSub = await prisma.userPlanSubscription.update({
        where: { id: subscriptionId },
        data: {
            planId: newPlanId,
            duration: newDuration,
            expiresAt: expiresAt,
            technicianIds: finalTechnicianIds,
            status: updatedStripeSub.status as any,
            cancelAtPeriodEnd: updatedStripeSub.cancel_at_period_end,
            autoRenew: !updatedStripeSub.cancel_at_period_end
        }
    });

    // Update global User Profile
    await prisma.user.update({
        where: { id: userId },
        data: {
            planId: newPlanId,
            subscriptionExpiresAt: expiresAt
        }
    });

    return {
        message: `Plan changed successfully. Prorated amount has been invoiced.`,
        data: updatedSub
    };
};

const getMyPaymentHistory = async (userId: string) => {
    // 1. Fetch all PAID payments or Trial payments (amount 0) for the user
    const payments = await prisma.payment.findMany({
        where: { 
            userId,
            OR: [
                { status: 'PAID' },
                { amount: 0 } 
            ]
        },
        include: {
            plan: {
                select: {
                    name: true,
                    category: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 2. Map through payments and fetch invoice URLs
    const results = await Promise.all(payments.map(async (payment) => {
        let invoiceUrl = null;
        if (payment.invoiceId) {
            try {
                const invoice = await stripe.invoices.retrieve(payment.invoiceId);
                invoiceUrl = invoice.hosted_invoice_url || invoice.invoice_pdf || null;
            } catch (err) {
                console.error(`Failed to fetch invoice ${payment.invoiceId} from Stripe:`, err);
            }
        }

        return {
            id: payment.id,
            orderId: payment.id,
            transactionId: payment.transactionId,
            date: payment.createdAt,
            planName: payment.plan?.name || "Unknown Plan",
            amount: payment.amount,
            status: payment.status,
            invoiceUrl: invoiceUrl,
            duration: payment.duration,
            isTrial: payment.amount === 0
        };
    }));

    return results;
};

const getLatestPayment = async (userId: string) => {
    const payment = await prisma.payment.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { plan: true }
    });

    if (!payment) {
        throw new ApiError(404, 'No payment record found for this user');
    }

    return payment;
};

const getPaymentById = async (paymentId: string, userId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { plan: true }
    });

    if (!payment) {
        throw new ApiError(404, 'Payment record not found');
    }

    // Security Check: Ensure the payment belongs to the requesting user
    if (payment.userId !== userId) {
        throw new ApiError(403, 'You do not have permission to view this payment record');
    }

    return payment;
};

export const PaymentServices = {
    createSubscriptionIntent,
    handleWebhook,
    confirmPayment,
    cancelRenewal,
    resumeRenewal,
    getMySubscriptions,
    changeSubscriptionPlan,
    getMyPaymentHistory,
    getLatestPayment,
    getPaymentById
};
