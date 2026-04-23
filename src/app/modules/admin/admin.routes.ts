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

router.get(
  '/shops',
  auth(UserRole.ADMIN),
  AdminController.getAllShops
);

router.patch(
  '/shops/status/:id',
  auth(UserRole.ADMIN),
  AdminController.updateShopStatus
);


export const AdminRoutes = router;
