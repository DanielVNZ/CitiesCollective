import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateUserCookieConsent, getUserCookieConsent } from 'app/db';

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

    return NextResponse.json({ consent });
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

    const { consent } = await request.json();
    
    if (!consent || !['all', 'necessary', null].includes(consent)) {
      return NextResponse.json({ error: 'Invalid consent value' }, { status: 400 });
    }

    const users = await getUser(session.user.email);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    await updateUserCookieConsent(userId, consent);

    return NextResponse.json({ success: true, consent });
  } catch (error) {
    console.error('Error updating cookie consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 