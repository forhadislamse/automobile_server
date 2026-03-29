import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import config from "../config/index";

// DigitalOcean Spaces Config
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: config.digitalOcean.endpoint!,
  credentials: {
    accessKeyId: config.digitalOcean.accessKey as string,
    secretAccessKey: config.digitalOcean.secretKey as string,
  },
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

    // console.log(` Deleted: ${key}`);
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


export const deleteImageAndFile = {
  deleteFileFromDigitalOcean,
  deleteMultipleFileFromDigitalOcean
};