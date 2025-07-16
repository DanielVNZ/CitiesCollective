import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateUser } from 'app/db';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    
    return NextResponse.json({ 
      id: user.id,
      email: user.email,
      username: user.username
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    const body = await request.json();
    const { username } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Validate username format (alphanumeric, underscores, hyphens, 3-32 characters)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        error: 'Username must be 3-32 characters long and contain only letters, numbers, underscores, and hyphens' 
      }, { status: 400 });
    }

    // Update user
    const updatedUser = await updateUser(userId, { username });
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        username: updatedUser.username 
      } 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof Error && error.message === 'Username already exists') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 