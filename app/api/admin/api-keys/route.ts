import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, createApiKey } from 'app/db';

export async function POST(request: NextRequest) {
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

    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json({ 
        error: 'User ID and name are required' 
      }, { status: 400 });
    }

    // Create API key
    const result = await createApiKey(userId, name);
    
    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create API key' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      apiKey: result[0]
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 