import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { TechnicianServices } from './technician.service';

const addTechnician = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await TechnicianServices.addTechnician(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Technician added and invitation sent successfully',
    data: result,
  });
});

const getShopTechnicians = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await TechnicianServices.getShopTechnicians(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technicians fetched successfully',
    data: result,
  });
});

const getTechnicianLimitInfo = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await TechnicianServices.getTechnicianLimitInfo(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician limit info fetched successfully',
    data: result,
  });
});

export const TechnicianController = {
  addTechnician,
  getShopTechnicians,
  getTechnicianLimitInfo,
};
