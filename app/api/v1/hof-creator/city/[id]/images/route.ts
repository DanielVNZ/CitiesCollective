import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, createApiResponse, createApiErrorResponse } from 'app/utils/apiAuth';
import { getCityById, getCityImages, createCityImage } from 'app/db';
import { uploadToR2, generateImageKeys } from 'app/utils/r2';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate using API key
    const authenticatedUser = await authenticateApiKey(request);
    if (!authenticatedUser) {
      return createApiErrorResponse('Invalid or missing API key', 401);
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return createApiErrorResponse('Invalid city ID', 400);
    }

    // Get city information and verify ownership
    const city = await getCityById(cityId);
    if (!city) {
      return createApiErrorResponse('City not found', 404);
    }

    // Check if the authenticated user owns this city
    if (city.userId !== authenticatedUser.userId) {
      return createApiErrorResponse('Unauthorized: You can only upload images to your own cities', 403);
    }

    // Check existing image count
    const existingImages = await getCityImages(cityId);
    const existingImageCount = existingImages.length;

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return createApiErrorResponse('No images provided', 400);
    }

    if (files.length > 15) {
      return createApiErrorResponse('Maximum 15 images allowed per upload', 400);
    }

    if (existingImageCount + files.length > 15) {
      return createApiErrorResponse(
        `Cannot upload ${files.length} images. This city already has ${existingImageCount} images. Maximum 15 images allowed per city.`,
        400
      );
    }

    const uploadedImages = [];

    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        continue; // Skip files that are too large
      }

      try {
        // Convert File to Buffer
        const imageBuffer = Buffer.from(await file.arrayBuffer());
        
        // Generate unique keys for R2 storage
        const imageKeys = generateImageKeys(file.name, authenticatedUser.userId);
        
        // Upload to R2 (using same image for all sizes for now)
        const [thumbnailResult, mediumResult, largeResult, originalResult] = await Promise.all([
          uploadToR2(imageBuffer, imageKeys.thumbnail, file.type),
          uploadToR2(imageBuffer, imageKeys.medium, file.type),
          uploadToR2(imageBuffer, imageKeys.large, file.type),
          uploadToR2(imageBuffer, imageKeys.original, file.type),
        ]);

        // Extract filename from key for database storage
        const fileName = imageKeys.thumbnail.split('/').pop() || `${Date.now()}.webp`;

        // Determine if this should be the primary image
        // First image uploaded to a city with no existing images becomes primary
        const shouldBePrimary = existingImageCount === 0 && uploadedImages.length === 0;

        // Save to database using existing function
        const imageData = {
          cityId,
          fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          width: 800, // Default for now
          height: 600, // Default for now
          thumbnailPath: thumbnailResult.url,
          mediumPath: mediumResult.url,
          largePath: largeResult.url,
          originalPath: originalResult.url,
          isPrimary: shouldBePrimary,
        };

        const savedImage = await createCityImage(imageData);
        uploadedImages.push(savedImage);

      } catch (fileError) {
        console.error('Error processing file:', file.name, fileError);
        // Continue with other files
      }
    }

    return createApiResponse({
      success: true,
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.length} images to city ${cityId}`
    });

  } catch (error) {
    console.error('HoF Creator image upload error:', error);
    return createApiErrorResponse('Internal server error', 500);
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
} 