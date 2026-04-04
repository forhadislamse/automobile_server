import Stripe from 'stripe';
import config from '../../../config';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';

const stripe = new Stripe(config.stripe.secret_key as string, {
    apiVersion: '2024-06-20' as any,
});

/**
 * Creates a Stripe Subscription (Incomplete) and returns the client_secret 
 * so the frontend can confirm the payment using Stripe Elements.
 */
const createSubscriptionIntent = async (userId: string, planId: string) => {
    // 1. Fetch User
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Check if user already has this specific plan active
    if (user.isSubscribed && user.planId === planId && user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You already have an active subscription for this plan.");
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

    // Free plan bypass (No Stripe needed)
    if (plan.price === 0) {
        // Handle free plan logic directly here or via a separate endpoint
        // For now, return a specific response that frontend can use to bypass Stripe
        return { isFree: true, planDetails: plan };
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
    // ... logic to find/create Price ID ...
    let stripePriceId: string;
    const prices = await stripe.prices.list({
        lookup_keys: [`plan_${plan.id}`],
        limit: 1
    });

    if (prices.data.length > 0) {
        stripePriceId = prices.data[0].id;
    } else {
        const product = await stripe.products.create({
            name: plan.name as string,
            description: plan.features.join(', ').substring(0, 250),
            metadata: { planId: plan.id }
        });
        
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.price * 100),
            currency: plan.currency.toLowerCase(),
            recurring: {
                interval: plan.duration === 'yearly' ? 'year' : 'month',
            },
            lookup_key: `plan_${plan.id}`
        });
        stripePriceId = price.id;
    }

    // 6. Create NEW Subscription
    const subscription = await stripe.subscriptions.create({
        customer: customerId as string,
        items: [{ price: stripePriceId }],
        description: `Subscription for ${plan.name} - Plan ID: ${plan.id} - User: ${user.email}`,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            userId: user.id,
            planId: plan.id
        }
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
        throw new ApiError(500, 'Failed to generate payment intent');
    }

    // 7. Create NEW Payment record in DB for history tracking
    const paymentRecord = await prisma.payment.create({
        data: {
            userId: user.id,
            planId: plan.id,
            amount: plan.price,
            status: 'PENDING',
            transactionId: paymentIntent.id as string,
            invoiceId: invoice.id as string
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
                
                // Get planId from subscription metadata
                const planId = subscription.metadata.planId;
                const userId = subscription.metadata.userId;

                // Update Payment Status
                if (paymentIntentId) {
                    // @ts-ignore
                    await prisma.payment.updateMany({
                        where: { transactionId: paymentIntentId },
                        data: { 
                            status: 'PAID',
                            invoiceId: invoice.id 
                        }
                    });
                }

                // Update User Subscription
                // @ts-ignore
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
            const customerId = subDeleted.customer as string;

            const userToUnsub = await prisma.user.findFirst({
                where: { stripeCustomerId: customerId }
            });

            if (userToUnsub) {
                await prisma.user.update({
                    where: { id: userToUnsub.id },
                    data: {
                        isSubscribed: false,
                        subscriptionExpiresAt: null,
                    },
                });
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
};

const confirmPayment = async (paymentId: string, paymentIntentId: string) => {
    // 1. Retrieve the payment intent from Stripe to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
        throw new ApiError(400, `Payment not confirmed. Stripe status: ${paymentIntent.status}`);
    }

    // 2. Fetch the Payment record from our DB
    // @ts-ignore
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

    // 3. Update Payment Status in DB
    // @ts-ignore
    const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID' }
    });

    // 4. Update User Subscription Details
    const duration = payment.plan.duration || 'monthly';
    const expiresAt = new Date();
    if (duration === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // @ts-ignore
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

    // 4. Verify if plan allows trial
    if (!plan.hasTrial) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'This plan does not offer a free trial.');
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

    // 7. Create a $0 Payment record for history
    await prisma.payment.create({
        data: {
            userId: user.id,
            planId: plan.id,
            amount: 0,
            status: 'PAID',
            transactionId: `TRIAL_${Math.random().toString(36).substring(7).toUpperCase()}`,
            invoiceId: 'FREE_TRIAL'
        }
    });

    return updatedUser;
};

export const PaymentServices = {
    createSubscriptionIntent,
    handleWebhook,
    confirmPayment,
    startFreeTrial
};
