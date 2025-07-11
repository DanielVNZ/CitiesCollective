import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, updateUser } from 'app/db';

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
    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isContentCreator } = body;

    if (typeof isContentCreator !== 'boolean') {
      return NextResponse.json({ error: 'Invalid content creator status' }, { status: 400 });
    }

    // Update user's content creator status
    const updatedUser = await updateUser(userId, { isContentCreator });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: `User ${isContentCreator ? 'promoted to' : 'removed from'} content creator status` 
    });

  } catch (error) {
    console.error('Error toggling content creator status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 