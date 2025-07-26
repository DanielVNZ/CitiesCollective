import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, assignHallOfFameImageToCity } from 'app/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const imageId = parseInt(params.id);
    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const { cityId } = await request.json();
    
    if (!cityId || isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Assign the image to the city
    await assignHallOfFameImageToCity(imageId, cityId);

    return NextResponse.json({ 
      success: true,
      message: 'Image assigned to city successfully'
    });
  } catch (error) {
    console.error('Error assigning image to city:', error);
    return NextResponse.json({ 
      error: 'Failed to assign image to city', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 