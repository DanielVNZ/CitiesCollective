import { NextRequest, NextResponse } from 'next/server';
import { cityTable, getUser, db } from 'app/db';
import { auth } from 'app/auth';
import { eq, and } from 'drizzle-orm';

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

    // Update the city
    const updatedCity = await db.update(cityTable)
      .set(updateData)
      .where(eq(cityTable.id, cityId))
      .returning();

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