import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g., https://bucket.citiescollective.space

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType?: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return {
    key,
    url: `${R2_PUBLIC_URL}/${key}`,
    size: file.length,
  };
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getDownloadUrl(key: string, expiresIn = 3600, filename?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ...(filename && {
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for uploading a file
 */
export async function generatePresignedUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique key for file storage
 */
export function generateFileKey(prefix: string, filename: string, userId: number): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  
  return `${prefix}/${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Generate keys for different image sizes
 */
export function generateImageKeys(filename: string, userId: number) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const baseName = filename.split('.')[0];
  const extension = filename.split('.').pop();
  
  return {
    original: `images/original/${userId}/${timestamp}-${randomId}-${baseName}.${extension}`,
    large: `images/large/${userId}/${timestamp}-${randomId}-${baseName}.webp`,
    medium: `images/medium/${userId}/${timestamp}-${randomId}-${baseName}.webp`,
    thumbnail: `images/thumbnails/${userId}/${timestamp}-${randomId}-${baseName}.webp`,
  };
} 