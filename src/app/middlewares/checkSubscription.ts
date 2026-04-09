
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
        
        // 1. Check access based on User Role
        let hasAccess = false;

        if (userData.role === UserRole.TECHNICIAN && userData.ownerId) {
            // STRICT CHECK for Technicians: Must belong to an ACTIVE, NOT EXPIRED bucket
            const activeBucketForTech = await prisma.userPlanSubscription.findFirst({
                where: {
                    ownerId: userData.ownerId,
                    isActive: true,
                    expiresAt: { gt: now },
                    technicianIds: { has: userData.id } // Strict bucket membership check
                }
            });

            if (activeBucketForTech) {
                hasAccess = true;
            }
        } else {
            // CHECK for Shop Owners: Can use global fields OR any active bucket
            const isSubscribed = userData.isSubscribed;
            const subscriptionExpiresAt = userData.subscriptionExpiresAt;

            // Fast track on User model
            hasAccess = !!(isSubscribed && subscriptionExpiresAt && subscriptionExpiresAt > now);

            // Fallback: Check all active buckets
            if (!hasAccess) {
                const activeBucket = await prisma.userPlanSubscription.findFirst({
                    where: {
                        ownerId: userData.id,
                        isActive: true,
                        expiresAt: { gt: now }
                    }
                });
                
                if (activeBucket) {
                    hasAccess = true;
                }
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
