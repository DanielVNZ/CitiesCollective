import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, createCityImage, getCityImages } from 'app/db';
import { processImage, validateImageFile, deleteImageFiles, ImageProcessingResult } from 'app/utils/imageProcessing';
import multer from 'multer';
import { promisify } from 'util';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Maximum 10 files at once
  },
});

const uploadMiddleware = promisify(upload.array('images', 10));

interface ProcessedImageSuccess extends ImageProcessingResult {
  index: number;
  success: true;
}

interface ProcessedImageError {
  index: number;
  success: false;
  error: string;
}

type ProcessedImageResult = ProcessedImageSuccess | ProcessedImageError;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const users = await getUser(userEmail);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse city ID
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Convert NextRequest to Express-like request for multer
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images allowed' }, { status: 400 });
    }

    // Convert File objects to Express.Multer.File format
    const multerFiles: Express.Multer.File[] = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          fieldname: 'images',
          originalname: file.name,
          encoding: '7bit',
          mimetype: file.type,
          size: buffer.length,
          buffer: buffer,
        } as Express.Multer.File;
      })
    );

    // Validate all files first
    const validationResults = multerFiles.map(validateImageFile);
    const invalidFiles = validationResults.filter(result => !result.isValid);
    
    if (invalidFiles.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid files detected', 
        details: invalidFiles.map(result => result.error) 
      }, { status: 400 });
    }

    // Process all images
    const processedImages: ProcessedImageResult[] = await Promise.all(
      multerFiles.map(async (file, index): Promise<ProcessedImageResult> => {
        try {
          const result = await processImage(file);
          return { ...result, index, success: true };
        } catch (error) {
          console.error(`Error processing image ${index}:`, error);
          return { 
            index, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    // Check if any processing failed
    const failedImages = processedImages.filter(result => !result.success);
    if (failedImages.length > 0) {
      return NextResponse.json({ 
        error: 'Some images failed to process', 
        details: failedImages 
      }, { status: 500 });
    }

    // Filter successful results and save to database
    const successfulImages = processedImages.filter((result): result is ProcessedImageSuccess => result.success);
    
    const savedImages = await Promise.all(
      successfulImages.map(async (result, index) => {
        try {
          const imageRecord = await createCityImage({
            cityId,
            fileName: result.fileName,
            originalName: result.originalName,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            width: result.width,
            height: result.height,
            thumbnailPath: result.thumbnailPath,
            mediumPath: result.mediumPath,
            largePath: result.largePath,
            originalPath: result.originalPath,
            isPrimary: index === 0, // First image is primary by default
          });
          return { ...imageRecord, success: true };
        } catch (error) {
          console.error(`Error saving image record:`, error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    const successfulUploads = savedImages.filter(result => result.success);
    const failedUploads = savedImages.filter(result => !result.success);

    return NextResponse.json({
      message: `Successfully uploaded ${successfulUploads.length} images`,
      uploaded: successfulUploads.length,
      failed: failedUploads.length,
      images: successfulUploads,
      errors: failedUploads.length > 0 ? failedUploads : undefined,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload images', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse city ID
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get all images for this city
    const images = await getCityImages(cityId);

    return NextResponse.json({
      cityId,
      images,
      count: images.length,
    });

  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json({ 
      error: 'Failed to get images', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 