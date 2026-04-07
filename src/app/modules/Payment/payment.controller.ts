import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PaymentServices } from './payment.services';
import ApiError from '../../../errors/ApiErrors';

const createSubscriptionIntent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { planId, duration } = req.body;

    if (!planId) {
        throw new ApiError(400, 'planId is required');
    }

    if (!duration) {
        throw new ApiError(400, 'duration is required (Monthly or Annually)');
    }

    const result = await PaymentServices.createSubscriptionIntent(userId, planId, duration);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subscription intent created successfully',
        data: result
    });
});

const handleWebhook = catchAsync(async (req: Request & { rawBody?: Buffer }, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const result = await PaymentServices.handleWebhook(req.rawBody as any, sig);
    res.status(200).send(result);
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params; // payment record ID
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "paymentIntentId is required");
    }

    const result = await PaymentServices.confirmPayment(id, paymentIntentId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment confirmed successfully. Subscription activated.",
        data: result,
    });
});

const startFreeTrial = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { planId } = req.body;

    if (!planId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'planId is required');
    }

    const result = await PaymentServices.startFreeTrial(userId, planId);

    sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Free trial started successfully',
    data: result,
  });
});

const cancelRenewal = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { subscriptionId } = req.params;
  const result = await PaymentServices.cancelRenewal(userId, subscriptionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Auto-renewal cancelled successfully',
    data: result,
  });
});

const resumeRenewal = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { subscriptionId } = req.params;
  const result = await PaymentServices.resumeRenewal(userId, subscriptionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Auto-renewal resumed successfully',
    data: result,
  });
});

const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await PaymentServices.getMySubscriptions(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My subscriptions fetched successfully',
    data: result,
  });
});

export const PaymentController = {
  createSubscriptionIntent,
  handleWebhook,
  confirmPayment,
  startFreeTrial,
  cancelRenewal,
  resumeRenewal,
  getMySubscriptions
};
