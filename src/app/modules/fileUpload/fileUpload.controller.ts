
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { fileUploadService } from './fileUpload.service';
import httpStatus from 'http-status';


const uploadMultipleImage = catchAsync(async (req, res) => {

  const result = await fileUploadService.uploadImages(req);
  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Images uploaded successfully",
      data: result
    });
});


const deleteMultipleImage = catchAsync(async (req, res) => {

  const files = req.body.files
  // console.log(files);
  const result = await fileUploadService.deleteFiles(files);
  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "files deleted successfully",
      data: result
    });
});
const deleteSingleImage = catchAsync(async (req, res) => {

  const file = req.body.file

  const result = await fileUploadService.deleteFile(file);
  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "files deleted successfully",
      data: null
    });
});


const uploadSingleImageController = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
    const fileUrl = await fileUploadService.uploadSingleImageService(file);


  sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Image uploaded successfully",
      data: fileUrl
    });
});




export const fileUploadController = {
  uploadMultipleImage,
  deleteMultipleImage,
  deleteSingleImage,
  uploadSingleImageController
};