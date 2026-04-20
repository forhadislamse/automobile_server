import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { AI_ACCESS_MAP, AIToolType } from './ai.constants';

/**
 * Validates if the current user (Technician or Owner) has access to a specific AI tool
 * based on the Shop Owner's active subscription.
 */
export const validateAIToolAccess = async (userId: string, requestedTool: AIToolType) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, ownerId: true }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find the Shop Owner ID
  const ownerId = user.role === UserRole.TECHNICIAN ? user.ownerId : user.id;

  if (!ownerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'No shop owner associated with this account');
  }

  // Fetch the Active Plan Subscription for the owner
  const planSubscription = await prisma.userPlanSubscription.findFirst({
    where: {
      ownerId: ownerId,
      status: { in: ['active', 'trialing'] },
      expiresAt: { gt: new Date() }
    },
    include: { plan: true }
  });

  if (!planSubscription) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'Active subscription required to access AI tools');
  }

  // Check if the requested tool is allowed for this plan category
  const allowedTools = AI_ACCESS_MAP[planSubscription.plan.category];
  
  if (!allowedTools.includes(requestedTool)) {
    throw new ApiError(
      httpStatus.FORBIDDEN, 
      `Access denied. The "${requestedTool}" is not included in the ${planSubscription.plan.name}. Please upgrade your plan.`
    );
  }

  return planSubscription;
};
