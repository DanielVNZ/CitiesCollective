import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateUserCookieConsent, getUserCookieConsent, getUserCookiePreferences, updateUserCookiePreferences, CookiePreferences } from 'app/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const users = await getUser(session.user.email);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    const consent = await getUserCookieConsent(userId);
    const preferences = await getUserCookiePreferences(userId);

    console.log('API GET - User ID:', userId, 'Consent:', consent, 'Preferences:', preferences);
    return NextResponse.json({ consent, preferences });
  } catch (error) {
    console.error('Error getting cookie consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { consent, preferences } = await request.json();
    
    const users = await getUser(session.user.email);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;

    // Handle individual preferences if provided
    if (preferences) {
      console.log('API received preferences:', preferences);
      
      // Validate preferences structure
      if (typeof preferences !== 'object' || 
          typeof preferences.necessary !== 'boolean' ||
          typeof preferences.analytics !== 'boolean' ||
          typeof preferences.performance !== 'boolean' ||
          typeof preferences.marketing !== 'boolean') {
        console.error('Invalid preferences structure:', preferences);
        return NextResponse.json({ error: 'Invalid preferences structure' }, { status: 400 });
      }
      
      await updateUserCookiePreferences(userId, preferences);
      console.log('Preferences saved to DB for user:', userId);
      return NextResponse.json({ success: true, preferences });
    }

    // Handle legacy consent if provided
    if (consent !== undefined) {
      if (consent !== null && !['all', 'necessary'].includes(consent)) {
        return NextResponse.json({ error: 'Invalid consent value' }, { status: 400 });
      }
      
      await updateUserCookieConsent(userId, consent);
      return NextResponse.json({ success: true, consent });
    }

    return NextResponse.json({ error: 'Either consent or preferences must be provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating cookie consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 