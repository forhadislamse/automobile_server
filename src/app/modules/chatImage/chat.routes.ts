import express from 'express';
import { chatController } from './chats.controller';
import auth from '../../middlewares/auth';
import { fileUploader } from '../../../helpars/fileUploader';



const router = express.Router();

// Upload chat images
router.post(
  '/upload-images',
  auth(),
  fileUploader.uploadMultipleImage,
  chatController.uploadChatImages
);

export const chatRoutes = router; 