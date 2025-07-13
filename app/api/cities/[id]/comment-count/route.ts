import { NextRequest, NextResponse } from 'next/server';
import { getCityCommentCount } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const commentCount = await getCityCommentCount(cityId);
    
    return NextResponse.json({
      commentCount
    });
  } catch (error) {
    console.error('Error getting comment count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 