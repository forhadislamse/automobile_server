import express from 'express';
import { PlanController } from './plan.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Public routes (for users to see available plans on frontend)
router.get('/', PlanController.getAllPlans);
router.get('/:id', PlanController.getPlanById);

// Admin-only routes
router.post('/', auth(UserRole.ADMIN), PlanController.createPlan);
router.patch('/:id', auth(UserRole.ADMIN), PlanController.updatePlan);
router.delete('/:id', auth(UserRole.ADMIN), PlanController.deletePlan);

export const PlanRoutes = router;
