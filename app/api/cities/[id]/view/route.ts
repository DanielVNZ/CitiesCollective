import { NextRequest, NextResponse } from 'next/server';
import { recordCityView, getCityViewCount } from 'app/db';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get or create session ID from cookies
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('city-view-session')?.value;
    
    if (!sessionId) {
      sessionId = randomUUID();
    }

    // Check if this session has already viewed this city
    const { hasViewedCity } = await import('app/db');
    const alreadyViewed = await hasViewedCity(cityId, sessionId);
    
    if (alreadyViewed) {
      // Return current count without recording another view
      const viewCount = await getCityViewCount(cityId);
      return NextResponse.json({ 
        success: true, 
        viewCount,
        sessionId,
        alreadyViewed: true
      });
    }

    // Record the view
    const success = await recordCityView(cityId, sessionId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
    }

    // Get updated view count
    const viewCount = await getCityViewCount(cityId);

    // Create response with view count
    const response = NextResponse.json({ 
      success: true, 
      viewCount,
      sessionId 
    });

    // Set session cookie if it doesn't exist (only set once)
    if (!cookieStore.get('city-view-session')) {
      response.cookies.set('city-view-session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Error recording city view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get view count
    const viewCount = await getCityViewCount(cityId);

    return NextResponse.json({ viewCount });

  } catch (error) {
    console.error('Error getting city view count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 