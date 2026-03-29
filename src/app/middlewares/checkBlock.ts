import { Request, Response, NextFunction } from "express";
import prisma from "../../shared/prisma";

export const checkBlockedStatus = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: "unauthorized",
      message: "User info missing from request. Are you authenticated?",
    });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
  if (!user) {
    return res.status(404).json({
      error: "not_found",
      message: "User not found.",
    });
  }

  if (user.status === ("BLOCKED" as typeof user.status)) {
    return res.status(403).json({
      error: "Your account is blocked",
      message: "Contact support via live chat or support@sendiate.com",
    });
  }
  next();
};
