import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PlanServices } from './plan.services';

const createPlan = catchAsync(async (req: Request, res: Response) => {
    const result = await PlanServices.createPlan(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Subscription plan created successfully',
        data: result
    });
});

const getAllPlans = catchAsync(async (req: Request, res: Response) => {
    const result = await PlanServices.getAllPlans();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subscription plans retrieved successfully',
        data: result
    });
});

const getPlanById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PlanServices.getPlanById(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subscription plan retrieved successfully',
        data: result
    });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PlanServices.updatePlan(id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subscription plan updated successfully',
        data: result
    });
});

const deletePlan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PlanServices.deletePlan(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null
    });
});

export const PlanController = {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan
};
