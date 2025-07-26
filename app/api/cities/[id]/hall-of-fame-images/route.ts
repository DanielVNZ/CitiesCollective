import { NextRequest, NextResponse } from 'next/server';
import { getHallOfFameImagesForCity } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);
    
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const images = await getHallOfFameImagesForCity(cityId);
    
    return NextResponse.json({ images }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching Hall of Fame images for city:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 