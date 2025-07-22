import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser } from 'app/db';

// Session storage key for viewed images
const VIEWED_IMAGES_KEY = 'viewed_images';

/**
 * Get viewed images from sessionStorage (client-side only)
 */
function getViewedImages(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  try {
    const stored = sessionStorage.getItem(VIEWED_IMAGES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (error) {
    console.error('View Tracking: Error reading from sessionStorage:', error);
  }
  return new Set<string>();
}

/**
 * Save viewed images to sessionStorage (client-side only)
 */
function saveViewedImages(viewedImages: Set<string>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const array = Array.from(viewedImages);
    sessionStorage.setItem(VIEWED_IMAGES_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('View Tracking: Error saving to sessionStorage:', error);
  }
}

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

    // For now, return 0 view count since we need to implement the database storage
    // TODO: Implement view count storage in database
    return NextResponse.json({
      viewCount: 0
    });
  } catch (error) {
    console.error('Error fetching image view count:', error);
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

    // Create a unique key for this user-image combination
    const viewKey = `${user.id}-${imageId}-${imageType}`;
    
    // Check if already viewed in this session
    const viewedImages = getViewedImages();
    if (viewedImages.has(viewKey)) {
      return NextResponse.json({
        viewed: true,
        viewCount: 0 // TODO: Return actual view count from database
      });
    }

    // TODO: Implement view count increment in database
    // For now, just mark as viewed in session storage
    viewedImages.add(viewKey);
    saveViewedImages(viewedImages);

    return NextResponse.json({
      viewed: true,
      viewCount: 0 // TODO: Return actual view count from database
    });
  } catch (error) {
    console.error('Error tracking image view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 