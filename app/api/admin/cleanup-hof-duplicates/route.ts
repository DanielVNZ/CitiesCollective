import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, removeDuplicateHallOfFameImages, fixDuplicatePrimaryImages } from 'app/db';

export async function POST(request: NextRequest) {
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

    // Remove duplicate Hall of Fame images
    await removeDuplicateHallOfFameImages();
    
    // Fix duplicate primary images
    await fixDuplicatePrimaryImages();

    return NextResponse.json({ 
      success: true,
      message: 'Duplicate Hall of Fame images and primary images cleaned up successfully'
    });
  } catch (error) {
    console.error('Error cleaning up duplicate Hall of Fame images:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up duplicates', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 