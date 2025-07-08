import { uploadToR2, generateImageKeys } from './r2';

export interface R2ImageProcessingResult {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  thumbnailPath: string;
  mediumPath: string;
  largePath: string;
  originalPath: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  originalUrl: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size too large. Maximum size is 10MB.' };
  }
  
  return { isValid: true };
}

export async function processImageForR2(file: Express.Multer.File, userId: number): Promise<R2ImageProcessingResult> {
  // For now, just upload the original image to all sizes (we'll add proper resizing later)
  const imageBuffer = file.buffer;
  
  // Generate unique keys for all image sizes
  const imageKeys = generateImageKeys(file.originalname, userId);
  
  // Upload the same image to all sizes for now (temporary solution)
  const [thumbnailResult, mediumResult, largeResult, originalResult] = await Promise.all([
    uploadToR2(imageBuffer, imageKeys.thumbnail, file.mimetype),
    uploadToR2(imageBuffer, imageKeys.medium, file.mimetype),
    uploadToR2(imageBuffer, imageKeys.large, file.mimetype),
    uploadToR2(imageBuffer, imageKeys.original, file.mimetype),
  ]);
  
  return {
    fileName: imageKeys.thumbnail.split('/').pop()?.split('-')[1] || '',
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    width: 800, // Default values for now
    height: 600,
    thumbnailPath: imageKeys.thumbnail,
    mediumPath: imageKeys.medium,
    largePath: imageKeys.large,
    originalPath: imageKeys.original,
    thumbnailUrl: thumbnailResult.url,
    mediumUrl: mediumResult.url,
    largeUrl: largeResult.url,
    originalUrl: originalResult.url,
  };
}

export function getImageUrl(imagePath: string): string {
  // For R2 URLs, return as-is if it's already a full URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // For R2 keys, construct the URL (this should be handled by the database)
  return imagePath;
} 