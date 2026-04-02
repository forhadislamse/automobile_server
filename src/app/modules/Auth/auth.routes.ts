import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { checkBlockedStatus } from "../../middlewares/checkBlock";

const router = express.Router();

router.post(
  "/register",
  AuthController.createUser
);


// user login route
router.post("/login", AuthController.loginUser);

// user logout route
router.post("/logout", AuthController.logoutUser);

//change password
router.put(
  "/change-password",
  auth(),
  checkBlockedStatus,
  AuthController.changePassword
);

//reset password
router.post("/reset-password", AuthController.resetPassword);

//forgot password
router.post("/forgot-password", AuthController.forgotPassword);

//resend otp
router.post("/resend-otp", AuthController.resendOtp);

//verify-otp
router.post("/verify-otp", AuthController.verifyForgotPasswordOtp);

//verify email otp
router.post("/verify-email-otp", AuthController.verifyEmailOtp);

//delete user
router.delete("/delete-user", auth(), AuthController.deleteUser);

export const AuthRoutes = router;
