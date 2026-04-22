import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { AdminController } from './admin.controller';

const router = express.Router();

router.get(
  '/dashboard',
  auth(UserRole.ADMIN),
  AdminController.getDashboardStats
);

export const AdminRoutes = router;
