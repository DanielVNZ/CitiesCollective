import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { toggleFavorite, isFavoritedByUser } from 'app/db';

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

    // Get user ID from session
    const { getUser } = await import('app/db');
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = users[0].id;
    const result = await toggleFavorite(userId, cityId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Check if current user has favorited this city
    const session = await auth();
    let isFavorited = false;
    
    if (session?.user?.email) {
      const { getUser } = await import('app/db');
      const users = await getUser(session.user.email);
      if (users.length > 0) {
        isFavorited = await isFavoritedByUser(users[0].id, cityId);
      }
    }
    
    return NextResponse.json({
      isFavorited
    });
  } catch (error) {
    console.error('Error getting favorite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 