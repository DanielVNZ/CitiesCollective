import { NextRequest, NextResponse } from 'next/server';
import { getCityById } from 'app/db';
import { getDownloadUrl } from 'app/utils/r2';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    try {
      // Generate presigned URL for R2 download
      const downloadUrl = await getDownloadUrl(city.filePath, 3600); // 1 hour expiry
      
      // Create a safe filename for download
      const safeFileName = city.fileName || `${city.cityName || 'city'}.cok`;
      const downloadFileName = safeFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Redirect to the presigned URL
      return NextResponse.redirect(downloadUrl);
      
    } catch (fileError) {
      console.error('R2 download error:', fileError);
      return NextResponse.json({ 
        error: 'File not found on storage',
        details: 'The save file may have been moved or deleted'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Download failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 