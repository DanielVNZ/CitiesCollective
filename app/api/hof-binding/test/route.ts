import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser } from 'app/db';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { hofCreatorId } = await request.json();

    if (!hofCreatorId) {
      return NextResponse.json({ error: 'HoF Creator ID is required' }, { status: 400 });
    }

    // Test the binding by making a real API call to Hall of Fame
    try {
      // First, get creator info using the CreatorID
      const creatorResponse = await fetch(`https://halloffame.cs2.mtq.io/api/v1/creators/me`, {
        headers: {
          'Authorization': `CreatorID ${hofCreatorId}`
        }
      });

      if (!creatorResponse.ok) {
        return NextResponse.json({
          error: `Failed to authenticate with Hall of Fame. Status: ${creatorResponse.status}`,
          details: 'Please check your Hall of Fame ID and try again.'
        }, { status: 400 });
      }

      const creatorData = await creatorResponse.json();
      const creatorId = creatorData.id;

      // Get screenshots using the creator ID
      const screenshotsResponse = await fetch(`https://halloffame.cs2.mtq.io/api/v1/screenshots?creatorId=${creatorId}`);

      if (!screenshotsResponse.ok) {
        return NextResponse.json({
          error: `Failed to fetch screenshots. Status: ${screenshotsResponse.status}`,
          details: 'Hall of Fame ID is valid but could not fetch images.'
        }, { status: 400 });
      }

      const screenshotsData = await screenshotsResponse.json();
      const imageCount = screenshotsData.length || 0;

      return NextResponse.json({
        success: true,
        message: `Successfully connected to Hall of Fame! Your Hall of Fame ID is valid and working.`,
        hasImages: imageCount > 0,
        imageCount: imageCount,
        creatorId: creatorId
      });

    } catch (apiError) {
      console.error('Hall of Fame API error:', apiError);
      return NextResponse.json({
        error: 'Failed to connect to Hall of Fame API',
        details: 'Please check your internet connection and try again.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('HoF binding test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 