import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/create-subscription-intent', auth(), PaymentController.createSubscriptionIntent);
router.post('/confirm-payment/:id', auth(), PaymentController.confirmPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

export const PaymentRoutes = router;
