
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
            where: { id: user.id }
        });

        if (!userData) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
        }

        const now = new Date();
        if (!userData.isSubscribed || (userData.subscriptionExpiresAt && userData.subscriptionExpiresAt < now)) {
            // Check if the requested content is a locked chapter or section
            // For simplicity, we'll mark some chapters as free and others as premium
            // Here we just throw error, but we could return "LOCKED" status in the response instead
            throw new ApiError(httpStatus.PAYMENT_REQUIRED, "Subscription required to access this content!");
        }

        next();
    } catch (err) {
        next(err);
    }
};

export default checkSubscription;
