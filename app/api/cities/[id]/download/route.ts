import { NextRequest, NextResponse } from 'next/server';
import { getCityById, getUser } from 'app/db';
import { getDownloadUrl } from 'app/utils/r2';
import { auth } from 'app/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Basic bot protection - check user agent
    const userAgent = req.headers.get('User-Agent') || '';
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /requests/i,
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    if (isSuspicious) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse city ID
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get city from database
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if city has a file path (R2 key)
    if (!city.filePath) {
      return NextResponse.json({ error: 'No file available for download' }, { status: 404 });
    }

    // Check if user is authenticated and if they own the city
    const session = await auth();
    let isOwner = false;
    
    if (session?.user?.email) {
      const users = await getUser(session.user.email);
      const user = users && users[0];
      isOwner = user && user.id === city.userId;
    }

    // Check if city is downloadable (allow owner to always download)
    if (!city.downloadable && !isOwner) {
      return NextResponse.json({ error: 'This city is not available for download' }, { status: 403 });
    }

    // Create a safe filename for download
    const originalFileName = city.fileName || `${city.cityName || 'city'}.cok`;
    let safeFileName = originalFileName;
    
    // Ensure it has .cok extension
    if (!safeFileName.endsWith('.cok')) {
      safeFileName = safeFileName.replace(/\.[^.]*$/, '') + '.cok';
    }
    
    // Clean filename for safety
    safeFileName = safeFileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Generate a signed URL that expires in 1 hour (3600 seconds) with proper filename
    const signedUrl = await getDownloadUrl(city.filePath, 3600, safeFileName);
    
    const response = NextResponse.redirect(signedUrl);
    
    // Optional: Track download analytics
    try {
      await fetch(`${req.nextUrl.origin}/api/cities/${cityId}/download-track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (trackError) {
      // Don't fail the download if tracking fails
      console.warn('Failed to track download:', trackError);
    }

    return response;

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Download failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 