import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateUser } from 'app/db';
import { sendHallOfFameUserUpdate } from '@/app/utils/hallOfFameWebhook';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const users = await getUser(session.user.email);
    const user = users && users[0];
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { hofCreatorId } = await request.json();

    // Validate input
    if (hofCreatorId && typeof hofCreatorId !== 'string') {
      return NextResponse.json({ error: 'HoF Creator ID must be a string' }, { status: 400 });
    }

    if (hofCreatorId && hofCreatorId.length > 100) {
      return NextResponse.json({ error: 'HoF Creator ID must be 100 characters or less' }, { status: 400 });
    }

    // Update user's HoF Creator ID
    const updatedUser = await updateUser(user.id, { hofCreatorId: hofCreatorId || null });

    // Send webhook to Hall of Fame if Creator ID is set
    if (hofCreatorId && hofCreatorId.trim()) {
      try {
        await sendHallOfFameUserUpdate(user.id, hofCreatorId.trim());
      } catch (webhookError) {
        // Log error but don't fail the update
        console.error('Failed to send Hall of Fame webhook:', webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'HoF Creator ID updated successfully'
    });

  } catch (error) {
    console.error('Error updating HoF Creator ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 