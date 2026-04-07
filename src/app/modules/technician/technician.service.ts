import { User, UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import * as bcrypt from 'bcrypt';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import emailSender from '../../../shared/emailSender';
import { TAddTechnician } from './technician.interface';
import { technicianInvitationTemplate } from './technician.utils';

const addTechnician = async (ownerId: string, payload: TAddTechnician) => {
  // 1. Fetch Shop Owner and their Plan
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    include: { plan: true },
  });

  if (!owner) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shop owner not found');
  }

  if (owner.role !== UserRole.USER) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only shop owners can add technicians');
  }

  if (!owner.isSubscribed || !owner.plan) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'You need an active subscription to add technicians');
  }

  // 2. Fetch the specific Plan Subscription
  const { planSubscriptionId, email, fullName, passkey } = payload;
  
  const planSubscription = await prisma.userPlanSubscription.findFirst({
    where: { 
      id: planSubscriptionId, 
      ownerId: ownerId,
      isActive: true 
    },
    include: { plan: true }
  });

  if (!planSubscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Active plan subscription not found');
  }

  // 3. Check Technician Limit for THIS specific plan
  const currentSlotCount = planSubscription.technicianIds.length;

  if (currentSlotCount >= planSubscription.plan.technicianLimit) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `This plan (${planSubscription.plan.name}) is full (${planSubscription.plan.technicianLimit}/${planSubscription.plan.technicianLimit} slots). Please use another plan or upgrade.`
    );
  }

  // 4. Create or reuse Technician User
  let technician = await prisma.user.findUnique({ where: { email } });
  
  if (!technician) {
    const hashedPassword = await bcrypt.hash(passkey, 10);
    technician = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        role: UserRole.TECHNICIAN,
        ownerId: ownerId,
        status: 'ACTIVE',
        isVerifyEmail: true,
      },
    });
  } else {
    // If technician already exists, they must be assigned to this owner
    if (technician.ownerId !== ownerId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'This technician email is already registered with another shop');
    }
  }

  // 5. Add Technician ID to this Plan Subscription's array
  // Check if technician is already in this specific plan
  if (planSubscription.technicianIds.includes(technician.id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Technician is already added to this plan');
  }

  await prisma.userPlanSubscription.update({
    where: { id: planSubscriptionId },
    data: {
      technicianIds: {
        push: technician.id
      }
    }
  });

  // 6. Send Invitation Email (only if new user)
  const shopName = owner.shopName || 'Your Shop';
  const html = technicianInvitationTemplate(shopName, passkey);
  await emailSender(email, html, `Invitation to join ${shopName} on SmartAutoTech.ai`);

  return technician;
};

const getShopTechnicians = async (ownerId: string) => {
  const technicians = await prisma.user.findMany({
    where: { ownerId: ownerId, isDeleted: false },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return technicians;
};

const getTechnicianLimitInfo = async (ownerId: string) => {
  const subscriptions = await prisma.userPlanSubscription.findMany({
    where: { ownerId: ownerId, isActive: true },
    include: { plan: true }
  });

  return subscriptions.map(sub => ({
    subscriptionId: sub.id,
    planName: sub.plan.name,
    limit: sub.plan.technicianLimit,
    current: sub.technicianIds.length,
    remaining: Math.max(0, sub.plan.technicianLimit - sub.technicianIds.length),
    duration: sub.duration,
    expiresAt: sub.expiresAt
  }));
};

export const TechnicianServices = {
  addTechnician,
  getShopTechnicians,
  getTechnicianLimitInfo,
};
