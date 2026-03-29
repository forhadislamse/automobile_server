import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import ApiError from "../../../errors/ApiErrors";
import { UserService } from "./user.services";
import { fileUploader } from "../../../helpars/fileUploader";

// get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await UserService.getMyProfile(userToken as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});

// update user profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const updateData = req.body.data ? JSON.parse(req.body.data) : {};
  const file = req.file;

  const user = await UserService.updateUserProfile(userId, updateData, file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: user,
  });
});

const updateProfileImage = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const file = req.file; //

  if (!file) {
    throw new ApiError(400, "No image found");
  }

  // DigitalOcean image upload
  const uploaded = await fileUploader.uploadToDigitalOcean(file);
  const imageUrl = uploaded.Location;

  // service call to update user profile image
  const user = await UserService.updateUserProfileImage(
    userToken as string,
    imageUrl
  );

  // service call to update user profile image
  res.status(200).json({
    success: true,
    message: "User profile image updated successfully!",
    data: user,
  });
});

const toggleOnlineStatus = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { isUserOnline } = req.body;
  
  const result = await UserService.toggleUserOnlineStatus(
    token as string,
    isUserOnline
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is now ${isUserOnline ? 'online' : 'offline'}`,
    data: result,
  });
});



const toggleNotificationOnOff = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { isNotificationOn } = req.body;

  const result = await UserService.toggleNotificationOnOff(
    token as string,
    isNotificationOn
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User is now ${isNotificationOn ? 'online' : 'offline'}`,
    data: result,
  });
});





export const UserController = {
  getMyProfile,
  updateProfile,
  updateProfileImage,
  toggleOnlineStatus,
  toggleNotificationOnOff,
};
