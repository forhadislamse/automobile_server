import { Router } from 'express';
import { fileUploadController } from './fileUpload.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { fileUploader } from '../../../helpars/fileUploader';

const router = Router();


router.post(
    '/files',
    auth(),
    fileUploader.uploadMultipleImage,
    fileUploadController.uploadMultipleImage
)

router.post(
  "/upload-single",
  auth(),
  fileUploader.uploadFile, 
  fileUploadController.uploadSingleImageController
);


router.delete(
    '/multiple-delete',
    auth(UserRole.ADMIN),
    fileUploadController.deleteMultipleImage
);


router.delete(
    '/single-delete',
    auth(UserRole.ADMIN),
    fileUploadController.deleteSingleImage
);


export const fileUploadRoutes = router;