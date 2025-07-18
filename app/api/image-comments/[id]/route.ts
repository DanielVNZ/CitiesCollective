import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, isUserAdmin } from 'app/db';
import { deleteImageComment, deleteImageCommentAsAdmin } from 'app/db';

export async function DELETE(
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

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.email);
    
    let deletedComment;
    if (isAdmin) {
      // Admin can delete any comment
      deletedComment = await deleteImageCommentAsAdmin(commentId);
    } else {
      // Regular users can only delete their own comments
      deletedComment = await deleteImageComment(commentId, user.id);
    }

    if (!deletedComment) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 