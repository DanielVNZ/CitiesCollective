import { NextRequest, NextResponse } from 'next/server';
import { cityTable, getUser, db } from 'app/db';
import { auth } from 'app/auth';
import { eq, and, sql } from 'drizzle-orm';
import { invalidateCityCache } from 'app/utils/cache-invalidation';

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

    // Get user
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    // Check if city exists and belongs to user
    const existingCity = await db.select()
      .from(cityTable)
      .where(and(eq(cityTable.id, cityId), eq(cityTable.userId, user.id)))
      .limit(1);

    if (existingCity.length === 0) {
      return NextResponse.json({ error: 'City not found or access denied' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { cityName, mapName } = body;

    // Validate input
    if (!cityName || typeof cityName !== 'string' || cityName.trim().length === 0) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      cityName: cityName.trim(),
      updatedAt: new Date(),
    };

    // Add map name if provided
    if (mapName !== undefined) {
      updateData.mapName = mapName.trim() || null;
    }

    // Get the old city name before updating
    const oldCityName = existingCity[0].cityName;

    // Update the city
    const updatedCity = await db.update(cityTable)
      .set(updateData)
      .where(eq(cityTable.id, cityId))
      .returning();

    // Update Hall of Fame cache entries that reference the old city name
    if (oldCityName && oldCityName !== cityName.trim()) {
      try {
        await db.execute(sql`
          UPDATE "hallOfFameCache" 
          SET "cityName" = ${cityName.trim()}
          WHERE LOWER("cityName") = LOWER(${oldCityName})
        `);
      } catch (error) {
        console.error('Failed to update Hall of Fame cache for city name change:', error);
      }
    }

    // Invalidate cache for this city
    await invalidateCityCache(cityId);

    return NextResponse.json({ 
      success: true, 
      city: updatedCity[0],
      message: 'City details updated successfully'
    });

  } catch (error) {
    console.error('Error updating city details:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 