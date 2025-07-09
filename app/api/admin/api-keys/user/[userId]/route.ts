import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, getUserApiKeys } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isUserAdmin(session.user.email);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get API keys for the user
    const apiKeys = await getUserApiKeys(userId);

    return NextResponse.json({
      success: true,
      apiKeys
    });

  } catch (error) {
    console.error('Error getting API keys:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 