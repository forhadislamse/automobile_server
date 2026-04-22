import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';
import { TechnicianController } from './technician.controller';
import { TechnicianValidation } from './technician.validation';
import checkSubscription from '../../middlewares/checkSubscription';

const router = express.Router();

router.post(
  '/add',
  auth(UserRole.USER),
  checkSubscription,
  validateRequest(TechnicianValidation.addTechnicianValidationSchema),
  TechnicianController.addTechnician
);

router.get(
  '/list',
  auth(UserRole.USER, UserRole.ADMIN),
  TechnicianController.getShopTechnicians
);

router.get(
  '/management-stats',
  auth(UserRole.USER),
  TechnicianController.getTechnicianManagementStats
);

router.patch(
  '/status/:id',
  auth(UserRole.USER),
  TechnicianController.updateTechnicianStatus
);

router.get(
  '/dashboard',
  auth(UserRole.USER),
  TechnicianController.getShopOwnerDashboard
);
router.get(
  '/limit-info',
  auth(UserRole.USER),
  TechnicianController.getTechnicianLimitInfo
);

router.post(
  '/create-diagnostic',
  auth(UserRole.USER, UserRole.TECHNICIAN),
  TechnicianController.createDiagnostic
);

router.delete(
  '/:id',
  auth(UserRole.USER),
  TechnicianController.deleteTechnician
);


export const TechnicianRoutes = router;
