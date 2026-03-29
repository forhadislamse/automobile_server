import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { fileUploader } from "../../../helpars/fileUploader";


const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.createUserIntoDb(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

//login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  res.cookie("token", result.token, { httpOnly: true });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

//logout user
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Successfully logged out",
    data: null,
  });
});

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;
  const { oldPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(
    userToken as string,
    newPassword,
    oldPassword
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Password changed successfully",
    data: result,
  });
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "We sent you an OTP, please check your email",
    data: result,
  });
});

//resend otp
const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resendOtp(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "We resent you an OTP, please check your email",
    data: result,
  });
});

//verify forgot password otp
const verifyForgotPasswordOtp = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthServices.verifyForgotPasswordOtp(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "OTP verified successfully, now you can reset your password",
      data: result,
    });
  }
);
//verify forgot password otp
const verifyEmailOtp = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthServices.verifyForgotPasswordOtp(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Verify your email successfully",
      data: result,
    });
  }
);

//reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "your password reset successfully now you can login",
    data: null,
  });
});

//delete user
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await AuthServices.deleteUser(userToken as string);

  // Clear the token cookie after deletion
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "your account deleted successfully",
    data: result,
  });
});

export const AuthController = {
  loginUser,
  logoutUser,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  deleteUser,
  createUser,
  verifyEmailOtp
};
