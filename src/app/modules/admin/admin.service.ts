import { UserRole, SubscriptionStatus, Prisma, UserStatus } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import prisma from '../../../shared/prisma';
import { paginationHelper } from '../../../helpars/paginationHelper';

const getDashboardStats = async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 1. Top Card Stats
  const activeShops = await prisma.user.count({
    where: { role: UserRole.USER, status: 'ACTIVE', isDeleted: false }
  });

  const activeSubscriptions = await prisma.userPlanSubscription.count({
    where: { status: { in: ['active', 'trialing'] }, expiresAt: { gt: now } }
  });

  const activeUsers = await prisma.user.count({
    where: { status: 'ACTIVE', isDeleted: false }
  });

  const aiSessionsToday = await prisma.diagnostic.count({
    where: { createdAt: { gte: todayStart, lte: todayEnd } }
  });

  // 2. Recent Users Table (Shop Owners)
  const recentUsersList = await prisma.user.findMany({
    where: { role: UserRole.USER, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      fullName: true,
      email: true,
      shopName: true,
      status: true,
      plan: {
        select: { name: true }
      },
      technicians: {
        where: { isDeleted: false },
        select: { id: true }
      }
    }
  });

  const recentUsers = recentUsersList.map(user => ({
    id: user.id,
    shopOwner: user.fullName,
    email: user.email,
    shopName: user.shopName || 'N/A',
    plan: user.plan?.name || 'No Plan',
    status: user.status,
    noOfTechnicians: user.technicians.length
  }));

  // 3. Active Users Chart (Last 7 Days)
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyUsers = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      isDeleted: false,
      updatedAt: { gte: weekStart, lte: weekEnd }
    },
    select: { updatedAt: true }
  });

  const activeUsersChart = daysInWeek.map(day => {
    const dayLabel = format(day, 'EEE');
    const count = weeklyUsers.filter(u => 
      format(u.updatedAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).length;
    return { day: dayLabel, users: count };
  });

  // 4. AI Sessions Stats (Monthly)
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const totalSessions = await prisma.diagnostic.count({
    where: { createdAt: { gte: monthStart, lte: monthEnd } }
  });

  const totalTechnicians = await prisma.user.count({
    where: { role: UserRole.TECHNICIAN, isDeleted: false }
  });

  // 5. Recent Billing Table
  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: { fullName: true }
      },
      plan: {
        select: { name: true }
      }
    }
  });

  const recentBilling = recentPayments.map(payment => ({
    orderId: `INV-${payment.id.slice(-4).toUpperCase()}`,
    date: payment.createdAt,
    shopOwner: payment.user?.fullName || 'Unknown',
    plan: payment.plan?.name || 'N/A',
    amount: payment.amount,
    status: payment.status
  }));

  return {
    topStats: {
      activeShops,
      activeSubscriptions,
      activeUsers,
      aiSessionsToday
    },
    recentUsers,
    activeUsersChart,
    aiSessions: {
      total: totalSessions,
      technicians: totalTechnicians
    },
    recentBilling
  };
};

const getAllShops = async (filters: any, options: any) => {
  const { searchTerm, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.UserWhereInput[] = [
    { role: UserRole.USER, isDeleted: false }
  ];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { shopName: { contains: searchTerm, mode: 'insensitive' } }
      ]
    });
  }

  if (Object.keys(filterData).length > 0) {
    Object.keys(filterData).forEach((key) => {
      if (key === 'category') {
        andConditions.push({
          plan: {
            category: (filterData as any)[key],
          },
        });
      } else {
        andConditions.push({
          [key]: {
            equals: (filterData as any)[key],
          },
        });
      }
    });
  }

  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      fullName: true,
      email: true,
      shopName: true,
      status: true,
      plan: {
        select: { id: true, name: true,category: true }
      },
      technicians: {
        where: { isDeleted: false },
        select: {
          id: true,
          fullName: true,
          email: true,
          totalSessions: true
        }
      }
    }
  });

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total
    },
    data: result
  };
};

const updateShopStatus = async (id: string, status: UserStatus) => {
  const result = await prisma.user.update({
    where: {
      id,
      role: UserRole.USER,
    },
    data: {
      status,
    },
  });

  return result;
};

const getAllSubscriptions = async (filters: any, options: any) => {
  const { searchTerm, status, planId, category } = filters;
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.PaymentWhereInput[] = [
    { status: { not: 'PENDING' } },
    {
      user: {
        email: { not: "" },
      },
    },
  ];

  if (searchTerm) {
    andConditions.push({
      user: {
        OR: [
          { shopName: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      }
    });
  }

  if (planId) {
    andConditions.push({ planId });
  }

  if (category) {
    andConditions.push({
      plan: {
        category: category as any
      }
    });
  }
  
  if (status) {
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'PAID') {
      andConditions.push({
        user: { planSubscriptions: { some: { status: 'active' } } },
      });
    } else if (statusUpper === 'TRIAL') {
      andConditions.push({
        user: { planSubscriptions: { some: { status: 'trialing' } } },
      });
    } else if (statusUpper === 'PAST DUE') {
      andConditions.push({
        user: {
          planSubscriptions: {
            some: {
              status: { in: ['past_due', 'unpaid', 'incomplete_expired'] },
            },
          },
        },
      });
    } else if (statusUpper === 'CANCELED') {
      andConditions.push({
        user: { planSubscriptions: { some: { status: 'canceled' } } },
      });
    } else if (statusUpper === 'INCOMPLETE') {
      andConditions.push({
        user: { planSubscriptions: { some: { status: 'incomplete' } } },
      });
    }
  }

  const whereConditions: Prisma.PaymentWhereInput = { AND: andConditions };

  const result = await prisma.payment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: { shopName: true, fullName: true, email: true }
      },
      plan: {
        select: { name: true }
      }
    }
  });

  const total = await prisma.payment.count({ where: whereConditions });

  // Fetch subscriptions to get trial/expiry info
  const ownerIds = result.map(p => p.userId);
  const activeSubscriptions = await prisma.userPlanSubscription.findMany({
    where: { ownerId: { in: ownerIds } }
  });

  const mappedData = result.map(payment => {
    // Find the latest subscription for this user. 
    // We prioritize matching planId, but fallback to any subscription for this user if not found.
    const subscription = activeSubscriptions.find(s => s.ownerId === payment.userId && s.planId === payment.planId) 
                         || activeSubscriptions.find(s => s.ownerId === payment.userId);
    
    let billingCycle = 'N/A';
    // If subscription exists, we will determine displayStatus from it. 
    // Otherwise, we fallback to payment status.
    let displayStatus = payment.status === 'PAID' ? 'Paid' : (payment.status === 'PENDING' ? 'Pending' : payment.status);

    if (subscription) {
      if (subscription.status === 'trialing') {
        const daysLeft = subscription.expiresAt 
          ? Math.ceil((subscription.expiresAt.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
          : 0;
        billingCycle = `Trial - ${daysLeft > 0 ? daysLeft : 0} days left`;
        displayStatus = 'Trial';
      } else if (subscription.status === 'active') {
        const dateStr = subscription.expiresAt ? format(subscription.expiresAt, 'MMM dd, yyyy') : '';
        billingCycle = `${payment.duration || 'Monthly'} - ${dateStr}`;
        displayStatus = 'Paid';
      } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        billingCycle = `${payment.duration || 'Monthly'} - Expired`;
        displayStatus = 'Past Due';
      } else if (subscription.status === 'incomplete_expired') {
        billingCycle = 'Trial Expired';
        displayStatus = 'Past Due';
      } else if (subscription.status === 'canceled') {
        billingCycle = 'Subscription Canceled';
        displayStatus = 'Canceled';
      } else if (subscription.status === 'incomplete') {
        billingCycle = 'Payment Incomplete';
        displayStatus = 'Incomplete';
      }
    }

    return {
      id: payment.id,
      shopName: payment.user?.shopName || payment.user?.fullName || 'N/A',
      orderId: `INV-${payment.id.slice(-4).toUpperCase()}`,
      plan: payment.plan?.name || 'N/A',
      billingCycle: billingCycle,
      status: displayStatus,
      paymentMethod: 'Stripe'
    };
  });

  return {
    meta: { page, limit, total },
    data: mappedData
  };
};

const getAllPayments = async (options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
  const andConditions: Prisma.PaymentWhereInput[] = [
    { status: { not: 'PENDING' } },
    {
      user: {
        email: { not: "" },
      },
    },
  ];

  const whereConditions: Prisma.PaymentWhereInput = { AND: andConditions };

  const total = await prisma.payment.count({ where: whereConditions });

  const result = await prisma.payment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: { fullName: true, email: true, shopName: true }
      },
      plan: {
        select: { name: true }
      }
    }
  });

  const mappedData = result.map(payment => ({
    id: payment.id,
    orderId: `INV-${payment.id.slice(-4).toUpperCase()}`,
    shopOwner: {
      name: payment.user?.fullName || 'Unknown',
      email: payment.user?.email || ''
    },
    date: payment.createdAt,
    plan: payment.plan?.name || 'N/A',
    amount: payment.amount,
    status: payment.status
  }));

  return {
    meta: { page, limit, total },
    data: mappedData
  };
};

export const AdminService = {
  getDashboardStats,
  getAllShops,
  updateShopStatus,
  getAllSubscriptions,
  getAllPayments
};

