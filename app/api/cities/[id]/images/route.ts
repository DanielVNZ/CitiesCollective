import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { createCityImage, getCityImages } from 'app/db';
import { uploadToR2, generateImageKeys } from 'app/utils/r2';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get user info and verify ownership using db functions
    const { getUser, getCityById } = await import('app/db');
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    if (city.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check existing image count
    const existingImages = await getCityImages(cityId);
    const existingImageCount = existingImages.length;

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed per upload' }, { status: 400 });
    }

    if (existingImageCount + files.length > 5) {
      return NextResponse.json({ 
        error: `Cannot upload ${files.length} images. This city already has ${existingImageCount} images. Maximum 5 images allowed per city.` 
      }, { status: 400 });
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
        const imageKeys = generateImageKeys(file.name, user.id);
        
        // Upload to R2 (using same image for all sizes for now)
        const [thumbnailResult, mediumResult, largeResult, originalResult] = await Promise.all([
          uploadToR2(imageBuffer, imageKeys.thumbnail, file.type),
          uploadToR2(imageBuffer, imageKeys.medium, file.type),
          uploadToR2(imageBuffer, imageKeys.large, file.type),
          uploadToR2(imageBuffer, imageKeys.original, file.type),
        ]);

        // Extract filename from key for database storage
        const fileName = imageKeys.thumbnail.split('/').pop() || `${Date.now()}.webp`;

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
          isPrimary: false,
        };

        const savedImage = await createCityImage(imageData);
        uploadedImages.push(savedImage);

      } catch (fileError) {
        console.error('Error processing file:', file.name, fileError);
        // Continue with other files
      }
    }

    return NextResponse.json({ 
      success: true, 
      images: uploadedImages 
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Get all images for this city using existing function
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