import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser } from 'app/db';
import { generatePresignedUrl } from 'app/utils/r2';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { fileName, fileSize, fileType } = await request.json();

    // Validate file type
    if (!fileName.endsWith('.cok')) {
      return NextResponse.json({ error: 'Only .cok files are allowed' }, { status: 400 });
    }

    // Validate file size (3GB limit)
    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (fileSize > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 3GB limit' }, { status: 400 });
    }

    // Generate presigned URL
    const key = `saves/${user.id}/${Date.now()}-${fileName}`;
    const presignedUrl = await generatePresignedUrl(key, fileType || 'application/octet-stream');

    return NextResponse.json({
      uploadUrl: presignedUrl,
      key: key,
      fileName: fileName
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate upload URL', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 