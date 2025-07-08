import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { addComment, getCityComments } from 'app/db';
import { moderateComment, shouldRejectComment, getModerationMessage } from 'app/utils/commentModeration';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const comments = await getCityComments(cityId);
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error getting comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const { content } = await request.json();
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Moderate the comment
    const moderationResult = await moderateComment(content.trim());
    
    // Check if comment should be rejected
    if (shouldRejectComment(moderationResult.reasons)) {
      const message = getModerationMessage(moderationResult.reasons);
      return NextResponse.json({ 
        error: message,
        moderationDetails: {
          reasons: moderationResult.reasons,
          originalContent: moderationResult.originalContent
        }
      }, { status: 400 });
    }

    // Get user ID from session
    const { getUser } = await import('app/db');
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    
    // Use filtered content if moderation found issues, otherwise use original
    const finalContent = moderationResult.isClean ? content.trim() : moderationResult.filteredContent;
    
    const comment = await addComment(userId, cityId, finalContent);
    
    // Return moderation info if content was filtered
    const response: any = { comment };
    if (!moderationResult.isClean) {
      response.moderationInfo = {
        wasFiltered: true,
        message: getModerationMessage(moderationResult.reasons),
        reasons: moderationResult.reasons
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 