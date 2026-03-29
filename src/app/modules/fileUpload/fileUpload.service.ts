import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { deleteImageAndFile } from "../../../helpars/fileDelete";



// Upload chat images
const uploadImages = async (req:any) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.images || files.images.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No images provided");
  }

  const uploadPromises = files.images.map(file => fileUploader.uploadToDigitalOcean(file));
  const uploadedImages = await Promise.all(uploadPromises);

  const imageUrls = uploadedImages.map(img => img.Location);
    if (imageUrls.length === 0) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to upload images");
    }

  return imageUrls
};



const deleteFiles = async (files:any) => {

  const deleted = await deleteImageAndFile.deleteMultipleFileFromDigitalOcean(files);

  if (!deleted) {
    throw new ApiError(httpStatus.NOT_FOUND, " Image delete failed!");
  }

  return 
};

const deleteFile = async (file:string) => {
  // console.log(file);

  const deleted = await deleteImageAndFile.deleteFileFromDigitalOcean(file);

  if (!deleted) {
    throw new ApiError(httpStatus.NOT_FOUND, " Image delete failed!");
  }

  return  null
};

const uploadSingleImageService = async (file: Express.Multer.File) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No image file provided");
  }

  let uploadedFile;
  try {
    uploadedFile = await fileUploader.uploadToDigitalOcean(file);
  } catch (error) {
    console.error("File upload failed:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
  }

  if (!uploadedFile?.Location) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to get file URL");
  }

  return uploadedFile.Location;
};


export const fileUploadService = {
  uploadImages,
  deleteFiles,
  deleteFile,
  uploadSingleImageService
};