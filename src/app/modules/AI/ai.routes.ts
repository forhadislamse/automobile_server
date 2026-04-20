import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { AIController } from './ai.controller';

const router = express.Router();

router.post(
  '/shop-foreman',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.shopForemanAI
);

router.post(
  '/mechanical-diagnostics',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.mechanicalDiagnosticsAI
);

router.post(
  '/obd2-interpreter',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.obd2InterpreterAI
);

router.post(
  '/electrical-diagnostics',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.electricalDiagnosticsAI
);

router.post(
  '/transmission-diagnostics',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.transmissionDiagnosticsAI
);

router.post(
  '/european-specialist',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  AIController.europeanSpecialistAI
);

export const AIRoutes = router;
