import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { client } from 'app/db';

export async function PUT(
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

    const { imageIds } = await request.json();

    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: 'imageIds must be an array' }, { status: 400 });
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

    // Verify all images belong to this city
    const imageResult = await client`
      SELECT id FROM "cityImages" WHERE "cityId" = ${cityId}`;
    
    const cityImageIds = imageResult.map(img => img.id);
    const allImagesBelongToCity = imageIds.every(id => cityImageIds.includes(id));
    
    if (!allImagesBelongToCity) {
      return NextResponse.json({ error: 'Some images do not belong to this city' }, { status: 400 });
    }

    // First, remove primary status from all images in this city
    await client`
      UPDATE "cityImages" 
      SET "isPrimary" = false
      WHERE "cityId" = ${cityId}`;

    // Update the order by setting sortOrder values and making the first image primary
    for (let i = 0; i < imageIds.length; i++) {
      const sortOrder = i; // Start from 0
      const isPrimary = i === 0; // First image becomes primary
      
      await client`
        UPDATE "cityImages" 
        SET "sortOrder" = ${sortOrder}, "isPrimary" = ${isPrimary}
        WHERE id = ${imageIds[i]} AND "cityId" = ${cityId}`;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error reordering images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 