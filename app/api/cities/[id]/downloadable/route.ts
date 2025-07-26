import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateCityDownloadable, getCityById } from 'app/db';
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

    // Get user ID
    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const { downloadable } = await request.json();
    
    if (typeof downloadable !== 'boolean') {
      return NextResponse.json({ error: 'downloadable must be a boolean' }, { status: 400 });
    }

    // Check if city exists and user owns it
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    if (city.userId !== user.id) {
      return NextResponse.json({ error: 'You can only modify your own cities' }, { status: 403 });
    }

    // Update the downloadable status
    const updatedCity = await updateCityDownloadable(cityId, user.id, downloadable);
    
    if (!updatedCity) {
      return NextResponse.json({ error: 'Failed to update city' }, { status: 500 });
    }

    // Invalidate cache for this city
    await invalidateCityCache(cityId);

    return NextResponse.json({ 
      message: 'City updated successfully',
      downloadable: updatedCity.downloadable 
    });

  } catch (error) {
    console.error('Update downloadable error:', error);
    return NextResponse.json({ 
      error: 'Failed to update city', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 