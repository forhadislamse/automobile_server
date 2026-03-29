import express from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpars/fileUploader";
import { UserController } from "./user.controller";
import multer from "multer";

const router = express.Router();

// get user profile
router.get("/profile", auth(), UserController.getMyProfile);

// update user profile
router.put(
  "/update-profile",
  auth(),
  fileUploader.uploadSingle,
  UserController.updateProfile
);

// update profile picture
router.put(
  "/update-profileImage",
  auth(),
  fileUploader.uploadSingle,
  UserController.updateProfileImage
);

// toggle online status
router.patch(
  "/toggle-online-status",
  auth(),
  UserController.toggleOnlineStatus
);

// toggle notification status
router.patch(
  "/toggle-notification-status",
  auth(),
  UserController.toggleNotificationOnOff
);


export const userRoutes = router;
