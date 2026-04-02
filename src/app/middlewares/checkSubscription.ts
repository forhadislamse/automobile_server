
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

        let isSubscribed = false;
        let subscriptionExpiresAt: Date | null = null;

        // Logic: If technician, check owner's sub. If shop owner, check own sub.
        if (userData.role === UserRole.TECHNICIAN && userData.ownerId) {
            isSubscribed = userData.owner?.isSubscribed || false;
            subscriptionExpiresAt = userData.owner?.subscriptionExpiresAt || null;
        } else {
            isSubscribed = userData.isSubscribed;
            subscriptionExpiresAt = userData.subscriptionExpiresAt;
        }

        const now = new Date();
        if (!isSubscribed || (subscriptionExpiresAt && subscriptionExpiresAt < now)) {
            throw new ApiError(httpStatus.PAYMENT_REQUIRED, "Subscription required to access this content!");
        }

        next();
    } catch (err) {
        next(err);
    }
};

export default checkSubscription;
