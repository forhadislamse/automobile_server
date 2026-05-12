import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { AIController } from './ai.controller';

const router = express.Router();

// Unified Master Diagnostic Session Management
router.post(
  '/sessions',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.startNewChat
);

router.post(
  '/sessions/message',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.sendMessage
);

router.get(
  '/sessions',
  auth(UserRole.USER, UserRole.TECHNICIAN, UserRole.ADMIN),
  AIController.getMyChatSessions
);

router.get(
  '/sessions/:sessionId/messages',
  auth(UserRole.USER, UserRole.TECHNICIAN, UserRole.ADMIN),
  AIController.getChatMessages
);

export const AIRoutes = router;
