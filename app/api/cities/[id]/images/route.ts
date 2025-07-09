import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { client } from 'app/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    // Verify user owns this city
    const cityResult = await client`
      SELECT "userId" FROM "City" WHERE id = ${cityId}`;
    
    if (cityResult.length === 0) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const city = cityResult[0];
    const userResult = await client`
      SELECT id FROM "User" WHERE email = ${session.user.email}`;
    
    if (userResult.length === 0 || userResult[0].id !== city.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check existing image count
    const existingImagesResult = await client`
      SELECT COUNT(*) as count FROM "cityImages" WHERE "cityId" = ${cityId}`;
    
    const existingImageCount = parseInt(existingImagesResult[0].count);

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

      // Generate unique filename
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${fileId}-${Date.now()}.${fileExtension}`;

      // Create directories
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'cities');
      const thumbnailDir = join(uploadDir, 'thumbnails');
      const mediumDir = join(uploadDir, 'medium');
      const largeDir = join(uploadDir, 'large');
      const originalDir = join(uploadDir, 'original');

      await mkdir(thumbnailDir, { recursive: true });
      await mkdir(mediumDir, { recursive: true });
      await mkdir(largeDir, { recursive: true });
      await mkdir(originalDir, { recursive: true });

      // Save original file
      const originalPath = join(originalDir, fileName);
      const originalBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(originalPath, originalBuffer as any);

      // For now, we'll use the same image for all sizes (you can add image processing later)
      const thumbnailPath = join(thumbnailDir, fileName);
      const mediumPath = join(mediumDir, fileName);
      const largePath = join(largeDir, fileName);

      await writeFile(thumbnailPath, originalBuffer as any);
      await writeFile(mediumPath, originalBuffer as any);
      await writeFile(largePath, originalBuffer as any);

      // Save to database
      const imageResult = await client`
        INSERT INTO "cityImages" (
          "cityId", "fileName", "originalName", "fileSize", "mimeType", 
          "width", "height", "thumbnailPath", "mediumPath", "largePath", "originalPath", "isPrimary"
        ) VALUES (
          ${cityId}, ${fileName}, ${file.name}, ${file.size}, ${file.type},
          ${null}, ${null}, ${`/uploads/cities/thumbnails/${fileName}`}, 
          ${`/uploads/cities/medium/${fileName}`}, ${`/uploads/cities/large/${fileName}`}, 
          ${`/uploads/cities/original/${fileName}`}, ${false}
        ) RETURNING *`;

      if (imageResult.length > 0) {
        uploadedImages.push(imageResult[0]);
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

    // Get all images for this city
    const images = await client`
      SELECT * FROM "CityImages" WHERE "cityId" = ${cityId}`;

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