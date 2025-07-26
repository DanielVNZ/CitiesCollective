import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, adminDeleteCityById, getCityById } from 'app/db';
import { invalidateHomePageCache } from 'app/utils/cache-invalidation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isUserAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cityId = parseInt(params.id);
  if (isNaN(cityId)) {
    return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
  }

  try {
    // First check if city exists
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Delete the city
    const deletedCity = await adminDeleteCityById(cityId);
    
    if (deletedCity) {
      // Invalidate home page cache since city listings will change
      await invalidateHomePageCache();
      
      return NextResponse.json({ 
        message: 'City deleted successfully', 
        cityId: cityId 
      });
    } else {
      return NextResponse.json({ error: 'Failed to delete city' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 