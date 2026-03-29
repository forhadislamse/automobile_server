// import express from "express";
// import { NotificationController } from "./Notification.controller";
// import auth from "../../middlewares/auth";
// import { UserRole } from "@prisma/client";
// import { checkBlockedStatus } from "../../middlewares/checkBlock";


// const router = express.Router();

// router.post(
//   "/send-to-selected",

//   auth(),
//   NotificationController.sendNotificationToSelectedUsersController
// );

// router.post(
//   "/send",
//   auth(),
//   checkBlockedStatus,
//   NotificationController.sendNotificationToUser
// );

// router.post(
//   "/save",
//   auth(),
//   checkBlockedStatus,
//   NotificationController.saveNotification
// )

// // Get all notifications
// router.get(
//   "/",
//   auth(UserRole.ADMIN),
//   checkBlockedStatus,
//   NotificationController.getAllNotificationsController
// );

// // Get notifications by user ID
// router.get(
//   "/get",
//   auth(),
//   NotificationController.getNotificationByUserIdController
// );

// // Mark notifications as read by user ID
// router.put(
//   "/read",
//   auth(),
//   NotificationController.readNotificationByUserIdController
// );

// // Delete notification by id
// router.delete(
//   "/delete/:id",
//   auth(),
//   NotificationController.deleteNotificationByIdController
// );

// router.post(
//   "/delete-selected",
//   auth(),
//   NotificationController.deleteSelectedNotificationsController
// );


// // Delete all notifications for the authenticated user
// router.delete(
//   "/delete-all",
//   auth(),
//   NotificationController.deleteAllNotificationsController
// );

// export const NotificationRoutes = router;
