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

  // 2. Check Technician Limit
  const currentTechnicianCount = await prisma.user.count({
    where: { ownerId: ownerId, role: UserRole.TECHNICIAN, isDeleted: false },
  });

  if (currentTechnicianCount >= owner.plan.technicianLimit) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Your current plan (${owner.plan.name}) allows a maximum of ${owner.plan.technicianLimit} technicians. Please upgrade for more.`
    );
  }

  // 3. Create Technician User
  const { email, fullName, passkey } = payload;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(passkey, 10);

  const newTechnician = await prisma.user.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      role: UserRole.TECHNICIAN,
      ownerId: ownerId,
      status: 'ACTIVE',
      isVerifyEmail: true, // Auto-verify as it's an invitation
    },
  });

  // 4. Send Invitation Email
  const shopName = owner.shopName || 'Your Shop';
  const html = technicianInvitationTemplate(shopName, passkey);
  await emailSender(email, html, `Invitation to join ${shopName} on SmartAutoTech.ai`);

  return newTechnician;
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
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    include: { plan: true },
  });

  if (!owner || !owner.plan) {
    return { limit: 0, current: 0, remaining: 0 };
  }

  const currentCount = await prisma.user.count({
    where: { ownerId: ownerId, isDeleted: false },
  });

  return {
    limit: owner.plan.technicianLimit,
    current: currentCount,
    remaining: Math.max(0, owner.plan.technicianLimit - currentCount),
    planName: owner.plan.name,
  };
};

export const TechnicianServices = {
  addTechnician,
  getShopTechnicians,
  getTechnicianLimitInfo,
};
