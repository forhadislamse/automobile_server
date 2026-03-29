import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";
import { PaymentRoutes } from "../modules/Payment/payment.route";

import { PlanRoutes } from "../modules/Plan/plan.route";

import { fileUploadRoutes } from "../modules/fileUpload/fileUpload.routes";
// import admin from "../../shared/firebase";

// import { NotificationRoutes } from "../modules/Notification/Notification.routes";
// import { AdminRoutes } from "../modules/admin/admin.routes";

// import { userCategoryInterestRoutes } from "../modules/admin/userCategoryInterest/userCategoryInterest.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },

  {
    path: "/file-uploads",
    route: fileUploadRoutes,
  },
  {
    path: "/uploads",
    route: fileUploadRoutes,
  },
  // {
  //   path: "/notifications",
  //   route: NotificationRoutes,
  // },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/plans",
    route: PlanRoutes,
  },
  // {
  //   path: "/admin",
  //   route: AdminRoutes,
  // },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
