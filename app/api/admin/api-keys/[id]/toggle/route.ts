import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, toggleApiKeyStatus } from 'app/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const keyId = parseInt(params.id);
    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid API key ID' }, { status: 400 });
    }

    // Toggle API key status (admin can toggle any key)
    await toggleApiKeyStatus(keyId, 0); // 0 means admin toggle

    return NextResponse.json({
      success: true,
      message: 'API key status updated successfully'
    });

  } catch (error) {
    console.error('Error toggling API key status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 