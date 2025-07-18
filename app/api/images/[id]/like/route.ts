import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser } from 'app/db';
import { toggleImageLike, getImageLikes, isImageLikedByUser } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type') as 'screenshot' | 'hall_of_fame';
    
    if (!imageType || !['screenshot', 'hall_of_fame'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
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

    const [likeCount, isLiked] = await Promise.all([
      getImageLikes(imageId, imageType),
      isImageLikedByUser(user.id, imageId, imageType)
    ]);

    return NextResponse.json({
      likeCount,
      isLiked
    });
  } catch (error) {
    console.error('Error fetching image like status:', error);
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

    const result = await toggleImageLike(user.id, imageId, imageType, parseInt(cityId));
    const newLikeCount = await getImageLikes(imageId, imageType);

    return NextResponse.json({
      liked: result.liked,
      likeCount: newLikeCount
    });
  } catch (error) {
    console.error('Error toggling image like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 