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

  // 2. Automatically Fetch the Active Plan Subscription
  const { email, fullName, passkey } = payload;
  const now = new Date();
  
  const planSubscription = await prisma.userPlanSubscription.findFirst({
    where: { 
      ownerId: ownerId,
      status: { in: ['active', 'trialing'] },
      expiresAt: { gt: now }
    },
    include: { plan: true }
  });

  if (!planSubscription) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'No active or non-expired subscription found. Please buy a plan to add technicians.');
  }

  const planSubscriptionId = planSubscription.id;

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
  const hashedPassword = await bcrypt.hash(passkey, 10);
  
  if (!technician) {
    technician = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        passkey, // Plain text for owner
        role: UserRole.TECHNICIAN,
        ownerId: ownerId,
        status: 'INVITED', // Initial status
        isVerifyEmail: true,
      },
    });
  } else {
    // If technician already exists, they must be assigned to this owner
    if (technician.ownerId !== ownerId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'This technician email is already registered with another shop');
    }

    // Update password and passkey if a existing technician is added again
    await prisma.user.update({
      where: { id: technician.id },
      data: { 
        password: hashedPassword,
        passkey: passkey // Update passkey
      }
    });
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

  // 6. Always Send Invitation Email (Owner might provide new passkey)
  const shopName = owner.shopName || 'Your Shop';
  const html = technicianInvitationTemplate(shopName, passkey);
  await emailSender(email, html, `Invitation to join ${shopName} on SmartAutoTech`);

  // 7. Fetch updated limit info to include in response
  const updatedLimitInfo = await getTechnicianLimitInfo(ownerId);

  return {
    technician,
    limitInfo: updatedLimitInfo[0] || null // Return the primary active plan's limit info
  };
};

const getShopTechnicians = async (ownerId: string) => {
  const technicians = await prisma.user.findMany({
    where: { ownerId: ownerId, isDeleted: false },
    select: {
      id: true,
      fullName: true,
      email: true,
      passkey: true,
      status: true,
      totalSessions: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return technicians;
};

const updateTechnicianStatus = async (techId: string, ownerId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED') => {
  const technician = await prisma.user.findFirst({
    where: { id: techId, ownerId: ownerId }
  });

  if (!technician) {
    throw new ApiError(httpStatus.NOT_FOUND, "Technician not found or doesn't belong to your shop");
  }

  return await prisma.user.update({
    where: { id: techId },
    data: { status }
  });
};

const getTechnicianManagementStats = async (ownerId: string) => {
  const activeTechnicians = await prisma.user.count({
    where: { 
      ownerId: ownerId, 
      status: 'ACTIVE', 
      isDeleted: false 
    }
  });

  // Calculate new technicians added this month (Active or Invited)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const newThisMonth = await prisma.user.count({
    where: {
      ownerId: ownerId,
      role: 'TECHNICIAN',
      isDeleted: false,
      status: 'ACTIVE',
      createdAt: { gte: startOfMonth }
    }
  });

  const invitationsSent = await prisma.user.count({
    where: { ownerId: ownerId, status: 'INVITED', isDeleted: false }
  });

  const limitInfo = await getTechnicianLimitInfo(ownerId);
  const primaryPlan = limitInfo[0] || null;

  // Fetch all technicians for the table
  const technicians = await getShopTechnicians(ownerId);

  return {
    activeTechnicians: {
      count: activeTechnicians,
      subtitle: `+${newThisMonth} this month`
    },
    activeInvitations: {
      sent: invitationsSent,
      remaining: primaryPlan?.remaining || 0,
      label: "Remaining Invitations"
    },
    activePlan: {
      name: primaryPlan?.planName || "No active plan",
      nextRenewal: primaryPlan?.expiresAt || null
    },
    technicians
  };
};

const getTechnicianLimitInfo = async (ownerId: string) => {
  const subscriptions = await prisma.userPlanSubscription.findMany({
    where: { ownerId: ownerId, status: { in: ['active', 'trialing'] } },
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
  updateTechnicianStatus,
  getTechnicianManagementStats,
};
