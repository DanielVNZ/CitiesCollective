import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, toggleImageCommentLike } from 'app/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = parseInt(params.id);
    
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await getUser(session.user.email);
    const user = userData && userData[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await toggleImageCommentLike(user.id, commentId);

    return NextResponse.json({
      liked: result.liked
    });
  } catch (error) {
    console.error('Error toggling image comment like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 