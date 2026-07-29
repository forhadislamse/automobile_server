import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import config from "../config/index";
import { v2 as cloudinary } from "cloudinary";

// DigitalOcean Spaces Config
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: config.digitalOcean.endpoint!,
  credentials: {
    accessKeyId: config.digitalOcean.accessKey as string,
    secretAccessKey: config.digitalOcean.secretKey as string,
  },
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary?.cloud_name,
  api_key: config.cloudinary?.api_key,
  api_secret: config.cloudinary?.api_secret,
});

async function deleteFileFromDigitalOcean(imageUrl: string): Promise<boolean> {
  try {
    const bucketName = config.digitalOcean.bucket!;
    const key = imageUrl.split(`${bucketName}/`)[1];

    if (!key) {
      console.warn(` Could not extract key from URL: ${imageUrl}`);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);
    return true;
  } catch (err: any) {
    console.error(" Delete failed:", err.message || err);
    return false;
  }
}

async function deleteMultipleFileFromDigitalOcean(
  imageUrls: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const url of imageUrls) {
    const isDeleted = await deleteFileFromDigitalOcean(url);
    if (isDeleted) {
      success.push(url);
    } else {
      failed.push(url);
    }
  }

  return { success, failed };
}

async function deleteFileFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    const urlParts = imageUrl.split("/");
    const filename = urlParts.pop();
    const folder = urlParts.pop();
    if (!filename) return false;
    
    // Cloudinary public_id usually doesn't include the file extension
    const publicId = folder ? `${folder}/${filename.split(".")[0]}` : filename.split(".")[0];
    
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err: any) {
    console.error(" Cloudinary delete failed:", err.message || err);
    return false;
  }
}

async function deleteMultipleFileFromCloudinary(
  imageUrls: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (const url of imageUrls) {
    const isDeleted = await deleteFileFromCloudinary(url);
    if (isDeleted) {
      success.push(url);
    } else {
      failed.push(url);
    }
  }

  return { success, failed };
}

export const deleteImageAndFile = {
  deleteFileFromDigitalOcean,
  deleteMultipleFileFromDigitalOcean,
  deleteFileFromCloudinary,
  deleteMultipleFileFromCloudinary
};