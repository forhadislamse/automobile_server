import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PaymentServices } from './payment.services';
import ApiError from '../../../errors/ApiErrors';

const createSubscriptionIntent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { planId, duration } = req.body;

    console.log("Create Intent Request Arrival:", { userId, body: req.body });

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
        message: result.message,
        data: result
    });
});

const handleWebhook = catchAsync(async (req: Request & { rawBody?: Buffer }, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const result = await PaymentServices.handleWebhook(req.rawBody as any, sig);
    res.status(200).send(result);
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const { paymentId, paymentIntentId } = req.body;

    if (!paymentId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "paymentId is required");
    }

    if (!paymentIntentId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "paymentIntentId is required");
    }

    const result = await PaymentServices.confirmPayment(paymentId, paymentIntentId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment confirmed successfully. Subscription activated.",
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

const changeSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { subscriptionId, newPlanId, newDuration, technicianIds } = req.body;

  if (!subscriptionId) {
    throw new ApiError(400, 'subscriptionId is required');
  }
  if (!newPlanId) {
    throw new ApiError(400, 'newPlanId is required');
  }
  if (!newDuration || !['Monthly', 'Annually'].includes(newDuration)) {
    throw new ApiError(400, 'Valid newDuration is required (Monthly or Annually)');
  }

  const result = await PaymentServices.changeSubscriptionPlan(userId, subscriptionId, newPlanId, newDuration, technicianIds);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await PaymentServices.getMyPaymentHistory(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment history fetched successfully',
    data: result,
  });
});

const getLatestPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await PaymentServices.getLatestPayment(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Latest payment record fetched successfully',
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  const result = await PaymentServices.getPaymentById(paymentId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment record fetched successfully',
    data: result,
  });
});

export const PaymentController = {
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
