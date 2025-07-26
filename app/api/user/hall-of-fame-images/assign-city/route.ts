import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, assignHallOfFameImageToCity } from 'app/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { hofImageId, cityId, cityName, imageData } = await request.json();
    
    if (!hofImageId || !cityId || !cityName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For external images, we need to create/update the hall of fame cache entry
    // This will store the image in our database and link it to the city
    try {
      // Import the upsert function
      const { upsertHallOfFameImage } = await import('app/db');
      
      // Upsert the hall of fame image with the city assignment
      await upsertHallOfFameImage(cityId, {
        hofImageId: hofImageId,
        cityName: cityName,
        cityPopulation: imageData.cityPopulation || null,
        cityMilestone: imageData.cityMilestone || null,
        imageUrlThumbnail: imageData.imageUrlThumbnail,
        imageUrlFHD: imageData.imageUrlFHD,
        imageUrl4K: imageData.imageUrl4K,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Image assigned to city successfully'
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to assign image to city', 
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error assigning hall of fame image to city:', error);
    return NextResponse.json({ 
      error: 'Failed to assign image to city', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 