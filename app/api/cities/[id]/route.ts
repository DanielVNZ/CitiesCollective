import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { deleteCityById, getUser } from 'app/db';
import { invalidateHomePageCache } from 'app/utils/cache-invalidation';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const users = await getUser(userEmail);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse city ID
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Delete the city (only if owned by the user)
    const deletedCity = await deleteCityById(cityId, user.id);
    
    if (!deletedCity) {
      return NextResponse.json({ 
        error: 'City not found or you do not have permission to delete it' 
      }, { status: 404 });
    }

    // Invalidate home page cache since city listings will change
    await invalidateHomePageCache();

    return NextResponse.json({ 
      message: 'City deleted successfully',
      city: deletedCity 
    });

  } catch (error) {
    console.error('Delete city error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete city', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 