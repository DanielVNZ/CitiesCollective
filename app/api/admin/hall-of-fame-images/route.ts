import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, getAllHallOfFameImages } from 'app/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all hall of fame images
    const images = await getAllHallOfFameImages();

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching hall of fame images:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch hall of fame images', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 