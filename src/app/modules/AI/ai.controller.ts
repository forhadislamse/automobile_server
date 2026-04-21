import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AIServices } from './ai.service';
import { AI_TOOLS } from './ai.constants';

const shopForemanAI = catchAsync(async (req: Request, res: Response) => {
  const result = await AIServices.processAIRequest(req.user.id, AI_TOOLS.SHOP_FOREMAN, req.body.prompt);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shop Foreman AI response fetched successfully',
    data: result,
  });
});

const mechanicalDiagnosticsAI = catchAsync(async (req: Request, res: Response) => {
  const result = await AIServices.processAIRequest(req.user.id, AI_TOOLS.MECHANICAL_DIAGNOSTICS, req.body.prompt);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Mechanical Diagnostics AI response fetched successfully',
    data: result,
  });
});

const obd2InterpreterAI = catchAsync(async (req: Request, res: Response) => {
  const result = await AIServices.processAIRequest(req.user.id, AI_TOOLS.OBD2_INTERPRETER, req.body.prompt);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OBD-II Code Interpreter AI response fetched successfully',
    data: result,
  });
});

const electricalDiagnosticsAI = catchAsync(async (req: Request, res: Response) => {
  const result = await AIServices.processAIRequest(req.user.id, AI_TOOLS.ELECTRICAL_DIAGNOSTICS, req.body.prompt);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Electrical Diagnostics AI response fetched successfully',
    data: result,
  });
});

const transmissionDiagnosticsAI = catchAsync(async (req: Request, res: Response) => {
  const result = await AIServices.processAIRequest(req.user.id, AI_TOOLS.TRANSMISSION_DIAGNOSTICS, req.body.prompt);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transmission Diagnostics AI response fetched successfully',
    data: result,
  });
});

const europeanSpecialistAI = catchAsync(async (req: Request, res: Response) => {
  const result = await AIServices.processAIRequest(req.user.id, AI_TOOLS.EUROPEAN_SPECIALIST, req.body.prompt);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'European Vehicle Specialist AI response fetched successfully',
    data: result,
  });
});

const startNewChat = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const ownerId = req.user.ownerId || userId;
  const result = await AIServices.startNewChat(userId, ownerId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Chat session started successfully',
    data: result,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await AIServices.sendMessage(userId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message sent and response received',
    data: result,
  });
});

const getMyChatSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const searchTerm = req.query.searchTerm as string;
  const result = await AIServices.getMyChatSessions(userId, searchTerm);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chat sessions fetched successfully',
    data: result,
  });
});

const getChatMessages = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const result = await AIServices.getChatMessages(sessionId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chat messages fetched successfully',
    data: result,
  });
});

export const AIController = {
  shopForemanAI,
  mechanicalDiagnosticsAI,
  obd2InterpreterAI,
  electricalDiagnosticsAI,
  transmissionDiagnosticsAI,
  europeanSpecialistAI,
  startNewChat,
  sendMessage,
  getMyChatSessions,
  getChatMessages
};
