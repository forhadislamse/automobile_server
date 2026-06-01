import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import * as bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import crypto from "crypto";
import httpStatus from "http-status";
import { generateOtp } from "../../../helpars/generateOtp";
import emailSender from "../../../shared/brevoMailSender";
import prisma from "../../../shared/prisma";
import { registrationOtpTemplate } from "../../../helpars/template/registrationOtpTemplate";
import { forgotPasswordTemplate } from "../../../helpars/template/forgotPasswordTemplate";
import { resendOTPTemplate } from "../../../helpars/template/resendOTP";




const createUserIntoDb = async (payload: any) => {
  console.log("Registration attempt: ", payload);
  const {
    email,
    phone,
    password,
    fullName,
    shopName,
    shopAddress,
    role,
    gender,
    fcmToken
  } = payload;

  // Validations
  if (!email) throw new ApiError(400, "Email is required");
  if (!phone) throw new ApiError(400, "Phone is required");
  if (!password) throw new ApiError(400, "Password is required");

  // Restrict Technician role from public registration
  if (role === "TECHNICIAN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Technicians can only join via invitation from a Shop Owner.");
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new ApiError(400, "Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  // OTP generation
  const otp = Number(crypto.randomInt(100000, 999999));
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  let newUser;
  try {
    newUser = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        fullName,
        shopName,
        shopAddress,
        role,
        gender: gender || "Male",
        fcmToken: fcmToken || "",
        otp,
        otpExpiresAt: otpExpires,
      },
    });
    console.log("User successfully created in DB:", newUser.id);

    // Send Registration OTP Email
    try {
      const html = registrationOtpTemplate(otp);
      await emailSender(email, html, "Verify your SmartAutoTech Account");
    } catch (error) {
      console.error("Failed to send registration OTP email:", error);
    }

  } catch (error) {
    console.error("Prisma error during user creation:", error);
    throw error;
  }

  const token = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role, ownerId: newUser.ownerId },
    config.jwt.jwt_secret!,
    config.jwt.expires_in!
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: newUser.id, role: newUser.role, email: newUser.email, ownerId: newUser.ownerId },
    config.jwt.refresh_token_secret!,
    config.jwt.refresh_token_expires_in!
  );

  return {
    user: { ...newUser, password: undefined },
    token,
    refreshToken,
  };

};


const loginUser = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const { email, password, fcmToken } = payload;

  if (!email || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email and password are required");
  }

  const userData = await prisma.user.findUnique({
    where: { email },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with this email!");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password!
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
  }

  // Handle Account Status (Blocked/Suspended)
  if (userData.status === "BLOCKED" || userData.status === "SUSPENDED") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Your account is ${userData.status.toLowerCase()}. ${userData.role === 'TECHNICIAN' ? 'Please contact your shop owner.' : 'Please contact support.'}`
    );
  }

  // Auto-activate technician on first login
  if (userData.role === "TECHNICIAN" && userData.status === "INVITED") {
    await prisma.user.update({
      where: { id: userData.id },
      data: { status: "ACTIVE" },
    });
  }

  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: { fcmToken: payload.fcmToken },
    });
  }

  const token = jwtHelpers.generateToken(
    { id: userData.id, role: userData.role, email: userData.email, ownerId: userData.ownerId },
    config.jwt.jwt_secret!,
    config.jwt.expires_in!
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: userData.id, role: userData.role, email: userData.email, ownerId: userData.ownerId },
    config.jwt.refresh_token_secret!,
    config.jwt.refresh_token_expires_in!
  );

  return { 
    token, 
    refreshToken, 
    role: userData.role, 
    id: userData.id, 
    email: userData.email,
    fullName: userData.fullName,
    profileImage: userData.profileImage,
  };
};


// change password
const changePassword = async (
  userToken: string,
  newPassword: string,
  oldPassword: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken?.id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password) {
    throw new ApiError(400, "User password not found");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const result = await prisma.user.update({
    where: {
      id: decodedToken.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return { message: "Password changed successfully" };
};

// forgot password
const forgotPassword = async (payload: { email: string }) => {
  // Fetch user data or throw if not found
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with this email!");
  }

  const otp = generateOtp(6);
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  console.log(payload.email);

  try {
    // const html = `Here is your OTP code: ${otp}. It will expire in 5 minutes.`;
    const html = forgotPasswordTemplate(otp);

    if (userData.email) {
      await emailSender(userData.email, html, "Reset Your Password – SmartAutoTech");
    }
  } catch (error) {
    console.error(`Failed to send OTP email:`, error);
  }

  // Update the user's OTP and expiration in the database
  await prisma.user.update({
    where: { id: userData.id },
    data: {
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    },
  });

  return ;
};

// resend otp
const resendOtp = async (email: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const otp = generateOtp(6);
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  try {
    // const html = `Here is your new OTP code: ${otp}. It will expire in 5 minutes.`;
    const html = resendOTPTemplate(otp);

    if (user.email) {
      await emailSender(user.email, html, "Resent OTP Code – SmartAutoTech");
    }
  } catch (error) {
    console.error(`Failed to send OTP email:`, error);
  }

  // Update the user's profile with the new OTP and expiration
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    },
  });

  return ;
};

// verify forgot password OTP
const verifyForgotPasswordOtp = async (payload: {
  email: string;
  otp: number;
}) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Check if the OTP is valid and not expired
  if (
    user.otp !== payload.otp ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  return { message: "OTP verification successful" };
};


// verify email otp
const verifyEmailOtp = async (payload: {
  email: string;
  otp: number;
}) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Check if email is already verified
  if (user.isVerifyEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified!");
  }

  // Check if the OTP is valid and not expired
  if (
    user.otp !== payload.otp ||
    !user.otpExpiresAt ||
    user.otpExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  // UPDATE USER: Mark email as verified + Clear OTP fields
  const updatedUser = await prisma.user.update({
    where: { email: payload.email },
    data: {
      isVerifyEmail: true,        
      otp: null,                  
      otpExpiresAt: null,         
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isVerifyEmail: true,
      updatedAt: true,
    }
  });

  return updatedUser;

};

// reset password
const resetPassword = async (payload: { password: string; email: string }) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Update the user's password in the database
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      password: hashedPassword, // Update with the hashed password
      otp: 0, // Clear the OTP
      otpExpiresAt: null, // Clear OTP expiration
    },
  });


  return { message: "Password reset successfully" };
};

// delete user
const deleteUser = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.id !== decodedToken.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this account"
    );
  }

  // Manually delete associated technicians because Prisma self-relations don't support Cascade in MongoDB
  await prisma.user.deleteMany({
    where: { ownerId: user.id },
  });

  const deletedUser = await prisma.user.delete({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  return deletedUser;
};

export const AuthServices = {
  createUserIntoDb,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  verifyEmailOtp,
  deleteUser,
};
