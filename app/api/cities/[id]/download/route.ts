import { NextRequest, NextResponse } from 'next/server';
import { getCityById } from 'app/db';
import path from 'path';
import fs from 'fs/promises';

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

    // Check if city has a file path
    if (!city.filePath) {
      return NextResponse.json({ error: 'No file available for download' }, { status: 404 });
    }

    // Construct the full file path
    const filePath = path.join(process.cwd(), city.filePath);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Create a safe filename for download
      const safeFileName = city.fileName || `${city.cityName || 'city'}.cok`;
      const downloadFileName = safeFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${downloadFileName}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
      
    } catch (fileError) {
      console.error('File access error:', fileError);
      return NextResponse.json({ 
        error: 'File not found on server',
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