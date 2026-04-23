import { Prisma, UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import * as bcrypt from "bcrypt";
import config from "../../config";


export const initiateSuperAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash(
      '12345678',
      Number(config.bcrypt_salt_rounds)
    );
 
    const payload: Prisma.UserCreateInput = {
      email: "admin@gmail.com",
      fullName: "regwheat",
      phone: "1234567890",
      password: hashedPassword,
      role: UserRole.ADMIN,
    };
 
    const isExistUser = await prisma.user.findFirst({
      where: { email: payload.email },
    });
 
    if (isExistUser) {
      console.log("Admin already exist!");
      return;
    };
 
    await prisma.user.create({
      data: payload,
    });
    console.log("Admin created successfully!");
  } catch (error) {
    console.error(" Admin init failed:", error);
  }
};