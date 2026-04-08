import Stripe from 'stripe';
import config from '../../../config';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';

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

    // Check if user already has an active subscription
    if (user.isSubscribed && user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You already have an active subscription.");
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

    // 3. Ensure User is a Stripe Customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
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
    }

    // 5. Handle Stripe Products/Prices dynamically
    const stripePriceId = await getOrCreateStripePrice(plan, duration);

    // 6. Create NEW Subscription
    const subscription = await stripe.subscriptions.create({
        customer: customerId as string,
        items: [{ price: stripePriceId }],
        description: `Subscription for ${plan.name} (${duration}) - User: ${user.email}`,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            userId: user.id,
            planId: plan.id,
            duration
        }
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
        throw new ApiError(500, 'Failed to generate payment intent');
    }

    // 7. Create NEW Payment record in DB with duration tracking
    const paymentRecord = await prisma.payment.create({
        data: {
            userId: user.id,
            planId: plan.id,
            amount: priceOption.price,
            duration: duration,
            status: 'PENDING',
            transactionId: paymentIntent.id as string,
            invoiceId: invoice.id as string,
            subscriptionId: subscription.id
        }
    });

    return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        orderId: paymentRecord.id
    };
};

const handleWebhook = async (payload: string, sig: string) => {
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            sig,
            config.stripe.webhook_secret as string
        );
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
                            duration: duration,
                            status: 'PAID',
                            transactionId: paymentIntentId,
                            invoiceId: invoice.id,
                            subscriptionId: subId
                        }
                    });
                }

                // 2. Create or Update UserPlanSubscription Bucket
                await prisma.userPlanSubscription.upsert({
                    where: { stripeSubscriptionId: subId },
                    update: {
                        isActive: true,
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
                        isActive: true,
                        autoRenew: !subscription.cancel_at_period_end,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end
                    }
                });

                // Global user status update
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isSubscribed: true,
                        planId: planId,
                        subscriptionExpiresAt: expiresAt,
                    },
                });
            }
            break;

        case 'customer.subscription.deleted':
            const subDeleted = event.data.object as Stripe.Subscription;
            await prisma.userPlanSubscription.updateMany({
                where: { stripeSubscriptionId: subDeleted.id },
                data: { isActive: false }
            });

            // If no more active subs, mark user as not subscribed
            const ownerId = subDeleted.metadata.userId;
            const activeSubs = await prisma.userPlanSubscription.count({
                where: { ownerId: ownerId, isActive: true }
            });

            if (activeSubs === 0) {
                await prisma.user.update({
                    where: { id: ownerId },
                    data: { isSubscribed: false }
                });
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
};

const confirmPayment = async (paymentId: string, paymentIntentId: string) => {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
        throw new ApiError(400, `Payment not confirmed. Stripe status: ${paymentIntent.status}`);
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

    const duration = payment.duration || 'Monthly';
    const expiresAt = new Date();
    if (duration === 'Annually') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Create UserPlanSubscription
    await prisma.userPlanSubscription.create({
        data: {
            ownerId: payment.userId,
            planId: payment.planId,
            duration: duration,
            stripeSubscriptionId: payment.subscriptionId,
            expiresAt: expiresAt,
            isActive: true
        }
    });

    await prisma.user.update({
        where: { id: payment.userId },
        data: {
            isSubscribed: true,
            planId: payment.planId,
            subscriptionExpiresAt: expiresAt,
        },
    });

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
        where: { ownerId: userId, isActive: true },
        include: { plan: true }
    });
};

const startFreeTrial = async (userId: string, planId: string) => {
    // 1. Fetch User
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // 2. Check if user already used a trial
    if (user.isTrialUsed) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You have already used your free trial.');
    }

    // 3. Fetch Subscription Plan
    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
    });

    if (!plan) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }

    // 4. Verify if plan allows trial AND it is a PROFESSIONAL plan
    if (!plan.hasTrial || plan.category !== 'PROFESSIONAL') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Free trial is only available for the Professional Shop Plan.');
    }

    // 5. Calculate expiry (14 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // 6. Update User
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            isSubscribed: true,
            isTrialUsed: true,
            planId: planId,
            subscriptionExpiresAt: expiresAt,
        },
    });

    // Create UserPlanSubscription for Trial
    await prisma.userPlanSubscription.create({
        data: {
            ownerId: userId,
            planId: planId,
            duration: 'Annually',
            expiresAt: expiresAt,
            isActive: true,
            stripeSubscriptionId: `TRIAL_${Math.random().toString(36).substring(7).toUpperCase()}`
        }
    });

    // 7. Create a $0 Payment record for history
    await prisma.payment.create({
        data: {
            userId: user.id,
            planId: plan.id,
            amount: 0,
            duration: 'Annually',
            status: 'PAID',
            transactionId: `TRIAL_${Math.random().toString(36).substring(7).toUpperCase()}`,
            invoiceId: 'FREE_TRIAL'
        }
    });

    return updatedUser;
};

const updateSubscriptionDuration = async (userId: string, subscriptionId: string, newDuration: 'Monthly' | 'Annually') => {
    // 1. Fetch Subscription from DB
    const sub = await prisma.userPlanSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
    });

    if (!sub || sub.ownerId !== userId || !sub.isActive) {
        throw new ApiError(404, "Active subscription not found");
    }

    if (sub.duration === newDuration) {
        throw new ApiError(400, `Subscription is already ${newDuration}`);
    }

    if (!sub.stripeSubscriptionId) {
        throw new ApiError(400, "This subscription is not managed by Stripe (e.g., Trial)");
    }

    // 2. Get/Create the New Price ID
    const newPriceId = await getOrCreateStripePrice(sub.plan, newDuration);

    // 3. Retrieve Subscription from Stripe to find Item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const itemId = stripeSubscription.items.data[0].id;

    // 4. Update Stripe Subscription with Proration
    const updatedStripeSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        items: [{
            id: itemId,
            price: newPriceId,
        }],
        proration_behavior: 'always_invoice', // Immediately charge/credit the difference
        metadata: {
            duration: newDuration // Update metadata for webhook consistency
        }
    });

    // 5. Update Database
    const expiresAt = new Date(updatedStripeSub.current_period_end * 1000);
    const updatedSub = await prisma.userPlanSubscription.update({
        where: { id: subscriptionId },
        data: {
            duration: newDuration,
            expiresAt: expiresAt
        }
    });

    // Also update global user status if this was their main plan
    await prisma.user.updateMany({
        where: { id: userId, planId: sub.planId },
        data: {
            subscriptionExpiresAt: expiresAt
        }
    });

    return {
        message: `Subscription updated to ${newDuration}. Prorated amount has been invoiced.`,
        data: updatedSub
    };
};

export const PaymentServices = {
    createSubscriptionIntent,
    handleWebhook,
    confirmPayment,
    startFreeTrial,
    cancelRenewal,
    resumeRenewal,
    getMySubscriptions,
    updateSubscriptionDuration
};
