import { NextRequest, NextResponse } from 'next/server';
import { getCityById } from 'app/db';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get city from database
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Get or create session ID from cookies
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('download-session')?.value;
    
    if (!sessionId) {
      sessionId = randomUUID();
    }

    // Get user agent and IP for analytics
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               request.headers.get('X-Real-IP') || 
               'unknown';

    // Log download analytics (you can extend this to store in database)
    console.log('Download tracked:', {
      cityId,
      cityName: city.cityName,
      sessionId,
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
      referer: request.headers.get('Referer') || 'direct'
    });

    // Create response with session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Download tracked successfully'
    });

    // Set session cookie if it doesn't exist
    if (!cookieStore.get('download-session')) {
      response.cookies.set('download-session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Download tracking error:', error);
    return NextResponse.json({ 
      error: 'Failed to track download', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 