
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiErrors";
import prisma from "../../shared/prisma";
import { UserRole } from "@prisma/client";

const checkSubscription = async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;

        // Admins can see everything
        if (user.role === UserRole.ADMIN) {
            return next();
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                owner: true // Include owner if the user is a technician
            }
        });

        if (!userData) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
        }

        const now = new Date();
        
        // Populate local variables from userData
        let isSubscribed = false;
        let subscriptionExpiresAt: Date | null = null;

        if (userData.role === UserRole.TECHNICIAN && userData.ownerId) {
            isSubscribed = userData.owner?.isSubscribed || false;
            subscriptionExpiresAt = userData.owner?.subscriptionExpiresAt || null;
        } else {
            isSubscribed = userData.isSubscribed;
            subscriptionExpiresAt = userData.subscriptionExpiresAt;
        }

        // 1. Check primary status on User model (for speed)
        let hasAccess = isSubscribed && subscriptionExpiresAt && subscriptionExpiresAt > now;

        // 2. If not found on User model, check all active buckets
        if (!hasAccess) {
            const activeBucket = await prisma.userPlanSubscription.findFirst({
                where: {
                    ownerId: userData.role === UserRole.TECHNICIAN ? userData.ownerId! : userData.id,
                    isActive: true,
                    expiresAt: { gt: now }
                }
            });
            
            if (activeBucket) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            throw new ApiError(httpStatus.PAYMENT_REQUIRED, "No active subscription or trial found!");
        }

        next();
    } catch (err) {
        next(err);
    }
};

export default checkSubscription;
