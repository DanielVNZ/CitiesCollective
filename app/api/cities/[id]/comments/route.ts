import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { addComment, getCityComments, notifyNewComment } from 'app/db';
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

    // Get sort parameter from query string
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') === 'recent' ? 'recent' : 'likes';

    // Get user ID for like status if authenticated
    let userId: number | undefined;
    try {
      const session = await auth();
      if (session?.user?.email) {
        const { getUser } = await import('app/db');
        const users = await getUser(session.user.email);
        if (users.length > 0) {
          userId = users[0].id;
        }
      }
    } catch (error) {
      // User not authenticated, continue without user ID
    }

    const comments = await getCityComments(cityId, userId, sortBy);
    
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

    const { content, taggedUsers = [] } = await request.json();
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
    
    // Send notification to city owner (if it's not their own comment)
    try {
      await notifyNewComment(userId, cityId, comment.id, finalContent);
    } catch (notificationError) {
      // Log the error but don't fail the comment creation
      console.error('Failed to send comment notification:', notificationError);
    }

    // Send notifications to tagged users
    if (taggedUsers.length > 0) {
      try {
        const { getUserByUsernameOrEmail, createNotification } = await import('app/db');
        
        for (const username of taggedUsers) {
          const taggedUser = await getUserByUsernameOrEmail(username);
          if (taggedUser.length > 0 && taggedUser[0].id !== userId) {
            await createNotification({
              userId: taggedUser[0].id,
              type: 'comment_tag',
              title: 'You were tagged in a comment',
              message: `@${users[0].username || 'Anonymous'} tagged you in a comment on a city`,
              relatedUserId: userId,
              relatedCityId: cityId,
              relatedCommentId: comment.id
            });
          }
        }
      } catch (tagNotificationError) {
        // Log the error but don't fail the comment creation
        console.error('Failed to send tag notifications:', tagNotificationError);
      }
    }
    
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