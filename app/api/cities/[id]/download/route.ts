import { NextRequest, NextResponse } from 'next/server';
import { getCityById, getUser } from 'app/db';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { auth } from 'app/auth';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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

    try {
      // Fetch file from R2
      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: city.filePath,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        return NextResponse.json({ error: 'File not found on storage' }, { status: 404 });
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const buffer = Buffer.concat(chunks);
      
      // Create a safe filename for download
      const originalFileName = city.fileName || `${city.cityName || 'city'}.cok`;
      let safeFileName = originalFileName;
      
      // Ensure it has .cok extension
      if (!safeFileName.endsWith('.cok')) {
        safeFileName = safeFileName.replace(/\.[^.]*$/, '') + '.cok';
      }
      
      // Clean filename for safety
      safeFileName = safeFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Return the file with proper headers
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${safeFileName}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
      
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