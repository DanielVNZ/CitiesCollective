import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export interface ImageProcessingResult {
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
}

export interface ImageSizes {
  thumbnail: { width: 300, height: 200 };
  medium: { width: 800, height: 600 };
  large: { width: 1200, height: 900 };
}

const IMAGE_SIZES: ImageSizes = {
  thumbnail: { width: 300, height: 200 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'cities');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function ensureUploadDirectoryExists() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    
    // Create subdirectories for different sizes
    await fs.mkdir(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'medium'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'large'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'original'), { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

export function validateImageFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size too large. Maximum size is 10MB.' };
  }
  
  return { isValid: true };
}

export async function processImage(file: Express.Multer.File): Promise<ImageProcessingResult> {
  await ensureUploadDirectoryExists();
  
  const fileName = `${uuidv4()}-${Date.now()}`;
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Get original image metadata
  const imageBuffer = file.buffer;
  const metadata = await sharp(imageBuffer).metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }
  
  // Ensure all subdirectories exist before processing
  await Promise.all([
    fs.mkdir(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true }),
    fs.mkdir(path.join(UPLOAD_DIR, 'medium'), { recursive: true }),
    fs.mkdir(path.join(UPLOAD_DIR, 'large'), { recursive: true }),
    fs.mkdir(path.join(UPLOAD_DIR, 'original'), { recursive: true }),
  ]);
  
  // Generate different sizes
  const results = await Promise.all([
    // Thumbnail - crop to fit aspect ratio
    generateResizedImage(imageBuffer, fileName, 'thumbnail', IMAGE_SIZES.thumbnail, true),
    
    // Medium - resize to fit within bounds
    generateResizedImage(imageBuffer, fileName, 'medium', IMAGE_SIZES.medium, false),
    
    // Large - resize to fit within bounds
    generateResizedImage(imageBuffer, fileName, 'large', IMAGE_SIZES.large, false),
    
    // Original - save as WebP for optimization, keep original format as backup
    saveOriginalImage(imageBuffer, fileName, file.mimetype, fileExtension),
  ]);
  
  return {
    fileName,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    width: metadata.width,
    height: metadata.height,
    thumbnailPath: results[0],
    mediumPath: results[1],
    largePath: results[2],
    originalPath: results[3],
  };
}

async function generateResizedImage(
  imageBuffer: Buffer,
  fileName: string,
  sizeType: keyof ImageSizes,
  dimensions: { width: number; height: number },
  crop: boolean = false
): Promise<string> {
  // Map size types to correct directory names
  const dirNames = {
    thumbnail: 'thumbnails',
    medium: 'medium',
    large: 'large'
  };
  
  const dirName = dirNames[sizeType];
  const outputPath = path.join(UPLOAD_DIR, dirName, `${fileName}.webp`);
  
  let sharpInstance = sharp(imageBuffer);
  
  if (crop) {
    // For thumbnails, crop to exact aspect ratio
    sharpInstance = sharpInstance
      .resize(dimensions.width, dimensions.height, {
        fit: 'cover',
        position: 'center',
      });
  } else {
    // For other sizes, resize to fit within bounds maintaining aspect ratio
    sharpInstance = sharpInstance
      .resize(dimensions.width, dimensions.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
  }
  
  await sharpInstance
    .webp({ quality: 85 })
    .toFile(outputPath);
  
  return `/uploads/cities/${dirName}/${fileName}.webp`;
}

async function saveOriginalImage(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string,
  fileExtension: string
): Promise<string> {
  // Save optimized WebP version
  const webpPath = path.join(UPLOAD_DIR, 'original', `${fileName}.webp`);
  await sharp(imageBuffer)
    .webp({ quality: 90 })
    .toFile(webpPath);
  
  // Also save original format as backup
  const originalPath = path.join(UPLOAD_DIR, 'original', `${fileName}-original${fileExtension}`);
  await fs.writeFile(originalPath, imageBuffer);
  
  return `/uploads/cities/original/${fileName}.webp`;
}

export async function deleteImageFiles(imagePaths: {
  thumbnailPath: string;
  mediumPath: string;
  largePath: string;
  originalPath: string;
}) {
  const pathsToDelete = [
    path.join(process.cwd(), 'public', imagePaths.thumbnailPath),
    path.join(process.cwd(), 'public', imagePaths.mediumPath),
    path.join(process.cwd(), 'public', imagePaths.largePath),
    path.join(process.cwd(), 'public', imagePaths.originalPath),
  ];
  
  // Also delete the original format backup
  const originalWebpPath = imagePaths.originalPath;
  const baseName = originalWebpPath.replace('.webp', '');
  const possibleBackupPaths = [
    `${baseName}-original.jpg`,
    `${baseName}-original.png`,
    `${baseName}-original.jpeg`,
    `${baseName}-original.gif`,
  ];
  
  possibleBackupPaths.forEach(backupPath => {
    pathsToDelete.push(path.join(process.cwd(), 'public', backupPath));
  });
  
  await Promise.allSettled(
    pathsToDelete.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file: ${filePath}`, error);
      }
    })
  );
}

export function getImageUrl(imagePath: string): string {
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
} 