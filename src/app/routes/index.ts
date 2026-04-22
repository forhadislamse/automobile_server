import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { userRoutes } from "../modules/User/user.route";
import { PaymentRoutes } from "../modules/Payment/payment.route";

import { PlanRoutes } from "../modules/Plan/plan.route";

import { fileUploadRoutes } from "../modules/fileUpload/fileUpload.routes";
import { TechnicianRoutes } from "../modules/technician/technician.routes";
import { AIRoutes } from "../modules/AI/ai.routes";
import { chatRoutes } from "../modules/chatImage/chat.routes";
// import admin from "../../shared/firebase";
import { AdminRoutes } from "../modules/admin/admin.routes";

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
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/plans",
    route: PlanRoutes,
  },
  {
    path: "/technicians",
    route: TechnicianRoutes,
  },
  {
    path: "/ai",
    route: AIRoutes,
  },
  {
    path: "/chat-images",
    route: chatRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
];


moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
