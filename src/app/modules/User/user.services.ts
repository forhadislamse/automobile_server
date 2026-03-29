import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import * as bcrypt from "bcrypt";
import { NotificationType, User } from "@prisma/client";
import config from "../../../config";
import httpStatus from "http-status";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { omit } from "lodash";
import { fileUploader } from "../../../helpars/fileUploader";
import { deleteImageAndFile } from "../../../helpars/fileDelete";
// import { notificationService } from "../Notification/Notification.service";

// get user profile
const getMyProfile = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const userProfile = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
    include: {
      plan: true,
    },
  });

  if (!userProfile) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check and update subscription status if expired
  const now = new Date();
  if (userProfile.isSubscribed && userProfile.subscriptionExpiresAt && userProfile.subscriptionExpiresAt < now) {
    // Update DB for consistency
    await prisma.user.update({
      where: { id: userProfile.id },
      data: { isSubscribed: false }
    });
    // Update local object for response
    userProfile.isSubscribed = false;
  }

  const userWithoutPassword = omit(userProfile, ["password"]);

  return userWithoutPassword;
};

//update user profile
const updateUserProfile = async (
  userId: string,
  updateData: Partial<User>,
  file?: Express.Multer.File
) => {
  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  // Disallow updating email or password
  if (updateData.password) throw new ApiError(400, "Password cannot be updated");
  if (updateData.email) throw new ApiError(400, "Email cannot be updated");

  // Handle profile image upload
  if (file) {
    const uploadedImageUrl = await fileUploader.uploadToDigitalOcean(file);
    updateData.profileImage = uploadedImageUrl.Location;

    // Delete old image if exists
    if (user.profileImage) {
      await deleteImageAndFile.deleteFileFromDigitalOcean(user.profileImage);
    }
  }

  // Only update fields that are provided or image is updated
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
  });

  // ---------------------------------------------------
  // 🚀 SEND PROFILE UPDATE NOTIFICATION
  // ---------------------------------------------------
  // const notificationPayload = {
  //   title: "Profile Updated",
  //   body: "Your profile information has been updated successfully.",
  //   type: NotificationType.UPDATE_PROFILE,
  //   targetId: user.id,
  //   slug: "update-profile",
  //   fcmToken: user.fcmToken || "",
  //   data: JSON.stringify({ userId: user.id }),
  // };

  // try {
  //   // Push notification (if FCM token exists)
  //   if (user.fcmToken) {
  //     await notificationService.sendNotification(
  //       user.fcmToken,
  //       notificationPayload,
  //       user.id
  //     );
  //   }

  //   // Save notification in DB
  //   await notificationService.saveNotification(notificationPayload, user.id);
  // } catch (error) {
  //   console.error("Failed to send or save profile update notification:", error);
  // }

  return { ...updatedUser, password: undefined };
};


//update user profile image
const updateUserProfileImage = async (userToken: string, imageUrl: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id }, // ✅ fixed here
    data: {
      profileImage: imageUrl,
    },
    select: {
      id: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const toggleUserOnlineStatus = async (
  userToken: string,
  isUserOnline: boolean
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      isUserOnline,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      phone: true,
      role: true,
      isUserOnline: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};



// toggle user online status
const toggleNotificationOnOff = async (
  userToken: string,
  isNotificationOn: boolean
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const existingUser = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: decodedToken.id },
    data: {
      isNotificationOn,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      phone: true,
      role: true,
      isNotificationOn: true,
      updatedAt: true,
    },
  });

  const userWithoutSensitive = omit(updatedUser, ["password", "fcmToken"]);
  return userWithoutSensitive;
};




export const UserService = {
  getMyProfile,
  updateUserProfile,
  updateUserProfileImage,
  toggleUserOnlineStatus,
  toggleNotificationOnOff,
};
