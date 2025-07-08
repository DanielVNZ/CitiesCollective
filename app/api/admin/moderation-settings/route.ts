import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getModerationSetting, setModerationSetting, isUserAdmin } from 'app/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current settings
    const profanityList = await getModerationSetting('profanityList') || [];
    const spamIndicators = await getModerationSetting('spamIndicators') || [];

    return NextResponse.json({
      profanityList,
      spamIndicators,
    });
  } catch (error) {
    console.error('Error getting moderation settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { profanityList, spamIndicators } = await request.json();

    // Validate input
    if (!Array.isArray(profanityList) || !Array.isArray(spamIndicators)) {
      return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
    }

    // Validate profanity list
    if (profanityList.some(word => typeof word !== 'string' || word.trim().length === 0)) {
      return NextResponse.json({ error: 'Profanity list contains invalid entries' }, { status: 400 });
    }

    // Validate spam indicators
    if (spamIndicators.some(indicator => typeof indicator !== 'string' || indicator.trim().length === 0)) {
      return NextResponse.json({ error: 'Spam indicators contain invalid entries' }, { status: 400 });
    }

    // Save settings
    await setModerationSetting('profanityList', profanityList);
    await setModerationSetting('spamIndicators', spamIndicators);

    return NextResponse.json({ 
      success: true,
      message: 'Moderation settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating moderation settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 