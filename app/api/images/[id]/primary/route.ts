import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, setPrimaryImage } from 'app/db';

export async function POST(
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

    // Parse image ID
    const imageId = parseInt(params.id);
    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Get city ID from request body
    const body = await req.json();
    const cityId = body.cityId;
    
    if (!cityId || isNaN(parseInt(cityId))) {
      return NextResponse.json({ error: 'Valid city ID required' }, { status: 400 });
    }

    // Set image as primary (includes ownership check)
    const result = await setPrimaryImage(imageId, parseInt(cityId), user.id);
    
    if (!result || !result.success) {
      return NextResponse.json({ error: 'Image not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Primary image updated successfully',
      imageId: imageId,
      cityId: parseInt(cityId),
      success: true,
    });

  } catch (error) {
    console.error('Set primary image error:', error);
    return NextResponse.json({ 
      error: 'Failed to set primary image', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 