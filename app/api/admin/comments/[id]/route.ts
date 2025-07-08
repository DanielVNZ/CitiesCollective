import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { deleteCommentAsAdmin, isUserAdmin } from 'app/db';

export async function DELETE(
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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const commentId = parseInt(params.id);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
    }

    const deletedComment = await deleteCommentAsAdmin(commentId);
    
    if (!deletedComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, comment: deletedComment });
  } catch (error) {
    console.error('Error deleting comment as admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 