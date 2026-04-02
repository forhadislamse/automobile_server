import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';
import { TechnicianController } from './technician.controller';
import { TechnicianValidation } from './technician.validation';

const router = express.Router();

router.post(
  '/add',
  auth(UserRole.USER),
  validateRequest(TechnicianValidation.addTechnicianValidationSchema),
  TechnicianController.addTechnician
);

router.get(
  '/list',
  auth(UserRole.USER, UserRole.ADMIN),
  TechnicianController.getShopTechnicians
);

router.get(
  '/limit-info',
  auth(UserRole.USER),
  TechnicianController.getTechnicianLimitInfo
);

export const TechnicianRoutes = router;
