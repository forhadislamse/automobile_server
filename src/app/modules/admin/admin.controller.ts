import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import pick from '../../../shared/pick';
import { AdminService } from './admin.service';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin dashboard stats fetched successfully',
    data: result,
  });
});

const getAllShops = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'status', 'planId', 'category']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  
  const result = await AdminService.getAllShops(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shops fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateShopStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await AdminService.updateShopStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Shop status updated to ${status} successfully`,
    data: result,
  });
});

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'status', 'planId', 'category']);
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  
  const result = await AdminService.getAllSubscriptions(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptions fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const AdminController = {
  getDashboardStats,
  getAllShops,
  updateShopStatus,
  getAllSubscriptions
};

