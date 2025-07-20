import { NextRequest, NextResponse } from 'next/server';
import { recordHomePageView } from 'app/db';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('sessionId')?.value;
    
    // Generate a new session ID if one doesn't exist
    if (!sessionId) {
      sessionId = randomUUID();
    }
    
    // Record the home page view
    await recordHomePageView(sessionId);
    
    // Set the session ID cookie with a 30-day expiration
    const response = NextResponse.json({ success: true });
    response.cookies.set('sessionId', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Error recording home page view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
} 