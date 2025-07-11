import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { client } from 'app/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, this endpoint doesn't update any profile fields
    // It's kept for compatibility but doesn't perform any updates

    // Get current user profile
    const result = await client`
      SELECT id, email, username, "isAdmin"
      FROM "User" 
      WHERE email = ${session.user.email}`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: result[0] 
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await client`
      SELECT id, email, username, "isAdmin"
      FROM "User" 
      WHERE email = ${session.user.email}`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result[0] });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 