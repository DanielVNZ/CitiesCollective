import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateCityOsmMap, getCityById } from 'app/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Check if city exists and user owns it
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    if (city.userId !== user.id) {
      return NextResponse.json({ error: 'You can only modify your own cities' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('osmMap') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - OSM files are XML
    const allowedTypes = ['application/xml', 'text/xml'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && fileExtension !== 'osm') {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a .osm file.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Please upload a file smaller than 10MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const fileName = `${uuidv4()}-osm-map.${fileExtension || 'osm'}`;
    
    // Create directory path (same as city images)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'cities', 'osm-maps');
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    // Update city with OSM map path
    const relativePath = `/uploads/cities/osm-maps/${fileName}`;
    const updatedCity = await updateCityOsmMap(cityId, user.id, relativePath);
    
    if (!updatedCity) {
      return NextResponse.json({ error: 'Failed to update city' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      osmMapPath: relativePath
    });

  } catch (error) {
    console.error('OSM map upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload OSM map', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Check if city exists and user owns it
    const city = await getCityById(cityId);
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    if (city.userId !== user.id) {
      return NextResponse.json({ error: 'You can only modify your own cities' }, { status: 403 });
    }

    // Remove OSM map (set to null)
    const updatedCity = await updateCityOsmMap(cityId, user.id, '');
    
    if (!updatedCity) {
      return NextResponse.json({ error: 'Failed to update city' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'OSM map removed successfully'
    });

  } catch (error) {
    console.error('OSM map delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove OSM map', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 