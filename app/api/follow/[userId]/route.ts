import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { toggleFollow, isFollowing, getFollowerCount, getFollowingCount } from 'app/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = parseInt(params.userId);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get current user's ID
    const { getUser } = await import('app/db');
    const users = await getUser(session.user.email);
    const currentUser = users[0];
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Toggle follow status
    const result = await toggleFollow(currentUser.id, targetUserId);
    
    // Get updated counts
    const followerCount = await getFollowerCount(targetUserId);
    const followingCount = await getFollowingCount(currentUser.id);

    return NextResponse.json({
      success: true,
      isFollowing: result.isFollowing,
      followerCount,
      followingCount
    });

  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = parseInt(params.userId);
    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get current user's ID
    const { getUser } = await import('app/db');
    const users = await getUser(session.user.email);
    const currentUser = users[0];
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if following
    const following = await isFollowing(currentUser.id, targetUserId);
    
    // Get counts
    const followerCount = await getFollowerCount(targetUserId);
    const followingCount = await getFollowingCount(targetUserId);

    return NextResponse.json({
      isFollowing: following,
      followerCount,
      followingCount
    });

  } catch (error) {
    console.error('Follow status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 