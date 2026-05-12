import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AIServices } from './ai.service';

const startNewChat = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const ownerId = req.user.ownerId || userId;
  const result = await AIServices.startNewChat(userId, ownerId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Diagnostic session started successfully',
    data: result,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await AIServices.sendMessage(userId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Diagnostic step processed successfully',
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
    message: 'Diagnostic sessions fetched successfully',
    data: result,
  });
});

const getChatMessages = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const result = await AIServices.getChatMessages(sessionId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Diagnostic steps fetched successfully',
    data: result,
  });
});

export const AIController = {
  startNewChat,
  sendMessage,
  getMyChatSessions,
  getChatMessages
};
