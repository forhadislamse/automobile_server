import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post('/create-subscription-intent', auth(), PaymentController.createSubscriptionIntent);
router.post('/start-free-trial', auth(), PaymentController.startFreeTrial);
router.post('/confirm-payment', auth(UserRole.USER), PaymentController.confirmPayment);
router.post('/start-trial', auth(UserRole.USER), PaymentController.startFreeTrial);

router.get('/my-subscriptions', auth(UserRole.USER), PaymentController.getMySubscriptions);
router.patch('/subscription/:subscriptionId/cancel-renewal', auth(UserRole.USER), PaymentController.cancelRenewal);
router.patch('/subscription/:subscriptionId/resume-renewal', auth(UserRole.USER), PaymentController.resumeRenewal);
router.patch('/subscription/:subscriptionId/update-duration', auth(UserRole.USER), PaymentController.updateSubscriptionDuration);

router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

export const PaymentRoutes = router;
