import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import sendResponse from "../../../shared/sendResponse";




// Upload chat images
const uploadChatImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.images || files.images.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No images provided");
  }

  const uploadPromises = files.images.map(file => fileUploader.uploadToDigitalOcean(file));
  const uploadedImages = await Promise.all(uploadPromises);

  const imageUrls = uploadedImages.map(img => img.Location);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Images uploaded successfully",
    data: imageUrls
  });
});

export const chatController = {
  uploadChatImages
}; 