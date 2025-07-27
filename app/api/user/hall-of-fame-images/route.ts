import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, getHallOfFameImagesForUser, client } from 'app/db';

export async function GET(request: NextRequest) {
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

    // Check if user has a HOF Creator ID
    if (!user.hofCreatorId) {
      return NextResponse.json({ images: [] });
    }

    try {
      // Step 1: Get creator info using the CreatorID
      const creatorResponse = await fetch(`https://halloffame.cs2.mtq.io/api/v1/creators/me`, {
        headers: {
          'Authorization': `CreatorID ${user.hofCreatorId}`
        }
      });

      if (!creatorResponse.ok) {
        console.error(`Failed to fetch creator info: ${creatorResponse.status}`);
        return NextResponse.json({ images: [] });
      }

      const creatorData = await creatorResponse.json();
      const creatorId = creatorData.id;

      // Step 2: Get screenshots using the creator ID
      const screenshotsResponse = await fetch(`https://halloffame.cs2.mtq.io/api/v1/screenshots?creatorId=${creatorId}`);

      if (!screenshotsResponse.ok) {
        console.error(`Failed to fetch screenshots: ${screenshotsResponse.status}`);
        return NextResponse.json({ images: [] });
      }

      const screenshotsData = await screenshotsResponse.json();

      // Get user's cities to check for automatic assignment
      const userCities = await client`
        SELECT id, "cityName" FROM "City" WHERE "userId" = ${user.id}
      `;

      // Clear any existing auto-assigned images for this user to refresh assignments
      // This ensures that when city names change, we re-evaluate auto-assignments
      await client`
        UPDATE "hallOfFameCache" 
        SET "cityId" = NULL 
        WHERE "cityId" IN (SELECT id FROM "City" WHERE "userId" = ${user.id})
      `;
      
      const userCityMap = new Map();
      userCities.forEach((city: any) => {
        if (city.cityName) {
          userCityMap.set(city.cityName.toLowerCase(), city.id);
        }
      });

      // Transform the external API data to match our internal format
      // Deduplicate by hofImageId to ensure we only have one record per unique image
      const uniqueImages = new Map();
      
      for (let index = 0; index < screenshotsData.length; index++) {
        const screenshot = screenshotsData[index];
        const cityName = screenshot.cityName || 'Unknown City';
        const cityId = userCityMap.get(cityName.toLowerCase()) || null;
        
        // If we already have this image, skip it (deduplication)
        if (uniqueImages.has(screenshot.id)) {
          continue;
        }
        
        // Save image to the cache (with or without cityId)
        try {
          // Import the upsert function
          const { upsertHallOfFameImage } = await import('app/db');
          
          // Save the image to cache (with or without cityId)
          await upsertHallOfFameImage(cityId, {
            hofImageId: screenshot.id,
            cityName: cityName,
            cityPopulation: screenshot.cityPopulation || null,
            cityMilestone: screenshot.cityMilestone || null,
            imageUrlThumbnail: screenshot.imageUrlThumbnail || screenshot.thumbnailUrl || screenshot.thumbnail || screenshot.imageUrl || screenshot.url || screenshot.image,
            imageUrlFHD: screenshot.imageUrlFHD || screenshot.hdUrl || screenshot.hd || screenshot.imageUrl || screenshot.url || screenshot.image,
            imageUrl4K: screenshot.imageUrl4K || screenshot.uhdUrl || screenshot.uhd || screenshot.imageUrl || screenshot.url || screenshot.image,
          });
        } catch (error) {
          console.error('Failed to save image to cache:', error);
        }
        
        const imageData = {
          id: uniqueImages.size, // Use unique count as ID
          cityId: cityId, // Auto-assign if city name matches
          hofImageId: screenshot.id,
          cityName: cityName,
          cityPopulation: screenshot.cityPopulation || null,
          cityMilestone: screenshot.cityMilestone || null,
          imageUrlThumbnail: screenshot.imageUrlThumbnail || screenshot.thumbnailUrl || screenshot.thumbnail || screenshot.imageUrl || screenshot.url || screenshot.image,
          imageUrlFHD: screenshot.imageUrlFHD || screenshot.hdUrl || screenshot.hd || screenshot.imageUrl || screenshot.url || screenshot.image,
          imageUrl4K: screenshot.imageUrl4K || screenshot.uhdUrl || screenshot.uhd || screenshot.imageUrl || screenshot.url || screenshot.image,
          isPrimary: uniqueImages.size === 0, // First unique image is primary
          createdAt: screenshot.createdAt || new Date().toISOString(),
          lastUpdated: screenshot.updatedAt || new Date().toISOString(),
          externalData: true // Flag to indicate this is from external API
        };
        
        uniqueImages.set(screenshot.id, imageData);
      }
      
      const images = Array.from(uniqueImages.values());

      return NextResponse.json({ images }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (apiError) {
      console.error('External Hall of Fame API error:', apiError);
      return NextResponse.json({ images: [] });
    }

  } catch (error) {
    console.error('Error fetching user hall of fame images:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch hall of fame images', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 