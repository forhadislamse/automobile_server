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

const getTechnicianManagementStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await TechnicianServices.getTechnicianManagementStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician management stats fetched successfully',
    data: result,
  });
});

const updateTechnicianStatus = catchAsync(async (req: Request, res: Response) => {
  const ownerId = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  const result = await TechnicianServices.updateTechnicianStatus(id, ownerId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Technician status updated to ${status} successfully`,
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

const getShopOwnerDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await TechnicianServices.getShopOwnerDashboard(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop owner dashboard stats fetched successfully',
    data: result,
  });
});

const createDiagnostic = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; // The person currently logged in (Technician)
  const ownerId = req.user.ownerId || userId; // If owner is doing it, use their ID. If technician, we need their ownerId from the token.
  
  // NOTE: I should ensure req.user has ownerId. 
  // If not, I'll need to fetch it from the database in the service.
  
  const result = await TechnicianServices.createDiagnostic(userId, ownerId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Diagnostic session recorded successfully',
    data: result,
  });
});

export const TechnicianController = {
  addTechnician,
  getShopTechnicians,
  getTechnicianLimitInfo,
  getTechnicianManagementStats,
  updateTechnicianStatus,
  getShopOwnerDashboard,
  createDiagnostic
};
