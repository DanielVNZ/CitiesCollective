import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, client } from 'app/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clear all auto-assigned images for this user
    await client`
      UPDATE "hallOfFameCache" 
      SET "cityId" = NULL 
      WHERE "cityId" IN (SELECT id FROM "City" WHERE "userId" = ${user.id})
    `;

    // Get user's cities
    const userCities = await client`
      SELECT id, "cityName" FROM "City" WHERE "userId" = ${user.id}
    `;

    // Re-assign images based on current city names
    for (const city of userCities) {
      if (city.cityName) {
        await client`
          UPDATE "hallOfFameCache" 
          SET "cityId" = ${city.id}
          WHERE LOWER("cityName") = LOWER(${city.cityName})
          AND "cityId" IS NULL
        `;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Hall of Fame assignments refreshed successfully' 
    });
  } catch (error) {
    console.error('Error refreshing Hall of Fame assignments:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh assignments', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 