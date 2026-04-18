import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post('/create-subscription-intent', auth(UserRole.USER), PaymentController.createSubscriptionIntent);
router.post('/confirm-payment', auth(UserRole.USER), PaymentController.confirmPayment);

router.get('/my-subscriptions', auth(UserRole.USER), PaymentController.getMySubscriptions);
router.get('/my-payments', auth(UserRole.USER), PaymentController.getMyPaymentHistory);
router.patch('/subscription/:subscriptionId/cancel-renewal', auth(UserRole.USER), PaymentController.cancelRenewal);
router.patch('/subscription/:subscriptionId/resume-renewal', auth(UserRole.USER), PaymentController.resumeRenewal);
router.post('/change-plan', auth(UserRole.USER), PaymentController.changeSubscriptionPlan);

router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

export const PaymentRoutes = router;
