import { uploadToR2, generateImageKeys } from './r2';
import sharp from 'sharp';

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
  const imageBuffer = file.buffer;
  
  // Get original image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || 800;
  const originalHeight = metadata.height || 600;
  
  // Generate unique keys for all image sizes
  const imageKeys = generateImageKeys(file.originalname, userId);
  
  // Create different sized images with Sharp
  const [thumbnailBuffer, mediumBuffer, largeBuffer] = await Promise.all([
    // Thumbnail: 400x300px, cropped to fit
    sharp(imageBuffer)
      .resize(400, 300, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer(),
    
    // Medium: 800x600px, resized to fit
    sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer(),
    
    // Large: 1200x900px, resized to fit
    sharp(imageBuffer)
      .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer(),
  ]);
  
  // Upload all versions to R2
  const [thumbnailResult, mediumResult, largeResult, originalResult] = await Promise.all([
    uploadToR2(thumbnailBuffer, imageKeys.thumbnail, 'image/webp'),
    uploadToR2(mediumBuffer, imageKeys.medium, 'image/webp'),
    uploadToR2(largeBuffer, imageKeys.large, 'image/webp'),
    uploadToR2(imageBuffer, imageKeys.original, file.mimetype), // Keep original format
  ]);
  
  return {
    fileName: imageKeys.thumbnail.split('/').pop()?.split('-')[1] || '',
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    width: originalWidth,
    height: originalHeight,
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