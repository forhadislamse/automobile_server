// import { notificationService } from "./Notification.service";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import catchAsync from "../../../shared/catchAsync";
// import sendResponse from "../../../shared/sendResponse";
// import { NotificationType } from "@prisma/client";

// const sendNotificationToUser = catchAsync(
//   async (req: Request, res: Response) => {
//     const {
//       // deviceToken,
//       fcmToken,
//       title,
//       body,
//       type = NotificationType.GENERAL,
//       data = "",
//       targetId = "",
//       slug = "",
//     } = req.body;

//     if (!fcmToken || !title || !body) {
//       return sendResponse(res, {
//         statusCode: httpStatus.BAD_REQUEST,
//         success: false,
//         message: "fcm token, title, and body are required!",
//         data: null,
//       });
//     }

//     const notificationPayload = {
//       title,
//       body,
//       type,
//       data: data.toString(),
//       targetId,
//       slug,
//     };

//     await notificationService.sendNotification(
//       fcmToken,
//       notificationPayload,
//       req.user?.id
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Notification sent successfully",
//       data: null,
//     });
//   }
// );

// const saveNotification = catchAsync(async (req: Request, res: Response) => {
//   const {
//     fcmToken,
//     title,
//     body,
//     type = NotificationType.GENERAL,
//     data = "",
//     targetId = "",
//     slug = "",
//   } = req.body;

//   const notificationPayload = {
//     title,
//     body,
//     type,
//     data: data.toString(),
//     targetId,
//     slug,
//   };

//   await notificationService.saveNotification(notificationPayload, req.user?.id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Notification saved successfully",
//     data: null,
//   });
// });

// const getAllNotificationsController = catchAsync(
//   async (req: Request, res: Response) => {
//     const notifications = await notificationService.getAllNotifications();

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "All notifications fetched successfully",
//       data: notifications,
//     });
//   }
// );

// const getNotificationByUserIdController = catchAsync(
//   async (req: Request, res: Response) => {
//     const notifications = await notificationService.getNotificationByUserId(
//       req.user?.id
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Notifications fetched successfully",
//       data: notifications,
//     });
//   }
// );

// const readNotificationByUserIdController = catchAsync(
//   async (req: Request, res: Response) => {
//     const notifications = await notificationService.readNotificationByUserId(
//       req.user?.id
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Notifications marked as read successfully",
//       data: notifications,
//     });
//   }
// );

// const deleteNotificationByIdController = catchAsync(
//   async (req: Request, res: Response) => {
//     const { id: notificationId } = req.params;

//     const result = await notificationService.deleteNotificationById(
//       req.user?.id,
//       notificationId
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Notification deleted successfully",
//       data: result,
//     });
//   }
// );

// const deleteSelectedNotificationsController = catchAsync(
//   async (req: Request, res: Response) => {
//     const { ids } = req.body; // array of notification IDs

//     const result = await notificationService.deleteSelectedNotifications(
//       req.user?.id,
//       ids
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Selected notifications deleted successfully",
//       data: result,
//     });
//   }
// );


// const deleteAllNotificationsController = catchAsync(
//   async (req: Request, res: Response) => {
//     const result = await notificationService.deleteAllNotifications(
//       req.user?.id
//     );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "All notifications deleted successfully",
//       data: result,
//     });
//   }
// );

// // const sendNotificationToSelectedUsersController = catchAsync(
// //   async (req: Request, res: Response) => {
// //     const token = req.headers.authorization;

// //     await notificationService.sendNotificationToSelectedUsers(
// //       token as string,
// //       req.body
// //     );

// //     sendResponse(res, {
// //       statusCode: httpStatus.OK,
// //       success: true,
// //       message: "Notifications sent successfully",
// //       data: null,
// //     });
// //   }
// // );

// const sendNotificationToSelectedUsersController = catchAsync(
//   async (req: Request, res: Response) => {
//     const { userIds, title, body, type, data, targetId, slug } = req.body;

//     if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//       return sendResponse(res, {
//         statusCode: httpStatus.BAD_REQUEST,
//         success: false,
//         message: "Please select at least one user!",
//         data: null,
//       });
//     }

//     if (!title || !body) {
//       return sendResponse(res, {
//         statusCode: httpStatus.BAD_REQUEST,
//         success: false,
//         message: "Title and body are required!",
//         data: null,
//       });
//     }

//     await notificationService.sendNotificationToSelectedUsers(userIds, {
//       title,
//       body,
//       type,
//       data,
//       targetId,
//       slug,
//     });

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Notifications sent successfully",
//       data: null,
//     });
//   }
// );

// export const NotificationController = {
//   sendNotificationToUser,
//   getAllNotificationsController,
//   getNotificationByUserIdController,
//   readNotificationByUserIdController,
//   deleteNotificationByIdController,
//   deleteSelectedNotificationsController,
//   deleteAllNotificationsController,
//   saveNotification,
//   sendNotificationToSelectedUsersController,
// };
