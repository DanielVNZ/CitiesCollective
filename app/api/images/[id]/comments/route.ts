import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser } from 'app/db';
import { getImageComments, addImageComment } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type') as 'screenshot' | 'hall_of_fame';
    const sortBy = searchParams.get('sortBy') as 'recent' | 'likes' || 'recent';
    
    if (!imageType || !['screenshot', 'hall_of_fame'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    const session = await auth();
    let requestUserId: number | undefined;
    
    if (session?.user?.email) {
      const userData = await getUser(session.user.email);
      const user = userData && userData[0];
      if (user) {
        requestUserId = user.id;
      }
    }

    const comments = await getImageComments(imageId, imageType, requestUserId, sortBy);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching image comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type') as 'screenshot' | 'hall_of_fame';
    const cityId = searchParams.get('cityId');
    
    if (!imageType || !['screenshot', 'hall_of_fame'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    if (!cityId) {
      return NextResponse.json({ error: 'City ID is required' }, { status: 400 });
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

    const body = await request.json();
    const { content, taggedUsers = [] } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment too long (max 1000 characters)' }, { status: 400 });
    }

    const comment = await addImageComment(user.id, imageId, imageType, parseInt(cityId), content.trim());

    // Send notifications to tagged users
    if (taggedUsers.length > 0) {
      try {
        const { getUserByUsernameOrEmail, createNotification } = await import('app/db');
        
        for (const username of taggedUsers) {
          const taggedUser = await getUserByUsernameOrEmail(username);
          if (taggedUser.length > 0 && taggedUser[0].id !== user.id) {
            await createNotification({
              userId: taggedUser[0].id,
              type: 'image_comment_tag',
              title: 'You were tagged in an image comment',
              message: `@${user.username || 'Anonymous'} tagged you in a comment on an image`,
              relatedUserId: user.id,
              relatedCityId: parseInt(cityId),
              relatedCommentId: comment.id,
              metadata: JSON.stringify({
                imageId: imageId,
                imageType: imageType
              })
            });
          }
        }
      } catch (tagNotificationError) {
        // Log the error but don't fail the comment creation
        console.error('Failed to send image comment tag notifications:', tagNotificationError);
      }
    }

    // Get the full comment with user data
    const comments = await getImageComments(imageId, imageType, user.id, 'recent');
    const newComment = comments.find(c => c.id === comment.id);

    return NextResponse.json({ comment: newComment || comment });
  } catch (error) {
    console.error('Error adding image comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 