import { NextRequest, NextResponse } from 'next/server';
import { db, getAllUsersWithHoFCreatorId } from '@/app/db';
import { sql } from 'drizzle-orm';

// Import the table creation function
import { client } from '@/app/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Hall of Fame cache update...');

    // Ensure the hallOfFameCache table exists with correct schema
    await client`
      CREATE TABLE IF NOT EXISTS "hallOfFameCache" (
        "id" serial PRIMARY KEY,
        "userId" integer REFERENCES "User"("id") ON DELETE CASCADE,
        "cityId" integer REFERENCES "City"("id") ON DELETE CASCADE,
        "hofImageId" varchar(255) NOT NULL,
        "cityName" varchar(255) NOT NULL,
        "cityPopulation" integer,
        "cityMilestone" integer,
        "imageUrlThumbnail" varchar(500) NOT NULL,
        "imageUrlFHD" varchar(500) NOT NULL,
        "imageUrl4K" varchar(500) NOT NULL,
        "isPrimary" BOOLEAN DEFAULT FALSE,
        "createdAt" timestamp DEFAULT now(),
        "lastUpdated" timestamp DEFAULT now()
      )
    `;

    // Check if userId column exists, add it if it doesn't
    const columnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'hallOfFameCache' 
        AND column_name = 'userId'
      )
    `;

    if (!columnExists[0].exists) {
      await client`
        ALTER TABLE "hallOfFameCache" 
        ADD COLUMN "userId" integer REFERENCES "User"("id") ON DELETE CASCADE
      `;
      console.log('Added userId column to hallOfFameCache table');
    }

    // Get all users with HoF Creator IDs
    const usersWithCreatorIds = await getAllUsersWithHoFCreatorId();

    console.log(`Found ${usersWithCreatorIds.length} users with Creator IDs`);

    let totalImagesProcessed = 0;
    let totalImagesCached = 0;

    for (const user of usersWithCreatorIds) {
      try {
        console.log(`Processing user ${user.id} with Creator ID: ${user.hofCreatorId}`);

        // Get creator info using the CreatorID
        const creatorResponse = await fetch(`https://halloffame.cs2.mtq.io/api/v1/creators/me`, {
          headers: {
            'Authorization': `CreatorID ${user.hofCreatorId}`
          }
        });

        if (!creatorResponse.ok) {
          console.log(`Failed to fetch creator info for user ${user.id}: ${creatorResponse.status}`);
          continue;
        }

        const creatorData = await creatorResponse.json();
        const creatorId = creatorData.id;

        // Get screenshots using the creator ID
        const screenshotsResponse = await fetch(`https://halloffame.cs2.mtq.io/api/v1/screenshots?creatorId=${creatorId}`);

        if (!screenshotsResponse.ok) {
          console.log(`Failed to fetch screenshots for user ${user.id}: ${screenshotsResponse.status}`);
          continue;
        }

        const screenshotsData = await screenshotsResponse.json();
        console.log(`Found ${screenshotsData.length} images for user ${user.id}`);

        // Process each image
        for (const image of screenshotsData) {
          totalImagesProcessed++;

          // Check if image already exists in cache using raw SQL
          const existingImage = await db.execute(sql`
            SELECT id FROM "hallOfFameCache" 
            WHERE "hofImageId" = ${image.id}
          `);

          if (existingImage.length > 0) {
            // Update existing image
            await db.execute(sql`
              UPDATE "hallOfFameCache" 
              SET 
                "cityName" = ${image.cityName},
                "cityPopulation" = ${image.cityPopulation},
                "cityMilestone" = ${image.cityMilestone},
                "imageUrlThumbnail" = ${image.imageUrlThumbnail},
                "imageUrlFHD" = ${image.imageUrlFHD},
                "imageUrl4K" = ${image.imageUrl4K},
                "createdAt" = ${image.createdAt},
                "lastUpdated" = NOW()
              WHERE "hofImageId" = ${image.id}
            `);
          } else {
            // Insert new image
            await db.execute(sql`
              INSERT INTO "hallOfFameCache" (
                "userId", "hofImageId", "cityName", "cityPopulation", "cityMilestone",
                "imageUrlThumbnail", "imageUrlFHD", "imageUrl4K", "createdAt", "lastUpdated"
              ) VALUES (
                ${user.id}, ${image.id}, ${image.cityName}, ${image.cityPopulation}, 
                ${image.cityMilestone}, ${image.imageUrlThumbnail}, ${image.imageUrlFHD}, 
                ${image.imageUrl4K}, ${image.createdAt}, NOW()
              )
            `);
            totalImagesCached++;
          }
        }

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        continue;
      }
    }

    console.log(`Cache update completed. Processed ${totalImagesProcessed} images, cached ${totalImagesCached} new images.`);

    return NextResponse.json({
      success: true,
      message: 'Hall of Fame cache updated successfully',
      stats: {
        usersProcessed: usersWithCreatorIds.length,
        totalImagesProcessed,
        newImagesCached: totalImagesCached
      }
    });

  } catch (error) {
    console.error('Error updating Hall of Fame cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Hall of Fame cache' },
      { status: 500 }
    );
  }
} 