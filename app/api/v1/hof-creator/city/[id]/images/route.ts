import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { createCityImage, getCityImages } from 'app/db';
import { processImageForR2 } from 'app/utils/r2ImageProcessing';

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

    if (files.length > 15) {
      return NextResponse.json({ error: 'Maximum 15 images allowed per upload' }, { status: 400 });
    }

    if (existingImageCount + files.length > 15) {
      return NextResponse.json({ 
        error: `Cannot upload ${files.length} images. This city already has ${existingImageCount} images. Maximum 15 images allowed per city.` 
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
        
        // Process image with Sharp for better quality
        const processedImage = await processImageForR2({
          buffer: imageBuffer,
          originalname: file.name,
          mimetype: file.type,
          size: file.size,
        } as Express.Multer.File, user.id);

        // Determine if this should be the primary image
        // First image uploaded to a city with no existing images becomes primary
        const shouldBePrimary = existingImageCount === 0 && uploadedImages.length === 0;

        // Save to database using existing function
        const imageData = {
          cityId,
          fileName: processedImage.fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          width: processedImage.width,
          height: processedImage.height,
          thumbnailPath: processedImage.thumbnailUrl,
          mediumPath: processedImage.mediumUrl,
          largePath: processedImage.largeUrl,
          originalPath: processedImage.originalUrl,
          isPrimary: shouldBePrimary,
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