import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import AdmZip from 'adm-zip';
import { cityTable, getUser, db, ensureCityTableExists, generateUniqueId, getCityCountByUser, notifyFollowersOfNewCity } from 'app/db';
import { auth } from 'app/auth';
import { uploadToR2, generateFileKey } from 'app/utils/r2';
import { invalidateHomePageCache } from 'app/utils/cache-invalidation';

// Configure the maximum body size for this route
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

// Configure body size limit for API routes in App Router
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('Upload request received');
  
  try {
    // Authenticate user
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      console.log('Upload failed: No user email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User authenticated:', userEmail);

    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      console.log('Upload failed: No file or invalid file type');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Get file data
    console.log('Processing file...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name;
    const baseName = path.parse(originalName).name;
    
    // Process the zip directly from memory (no temp files needed)
    console.log('Creating AdmZip from buffer...');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let metadata = null;
    let metadataContent = '';
    
    console.log('Found', zipEntries.length, 'entries in zip');
    
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.SaveGameMetadata')) {
        console.log('Found metadata file:', entry.entryName);
        try {
          metadataContent = entry.getData().toString('utf8');
          console.log('Raw metadata length:', metadataContent.length);
          console.log('First 100 chars:', JSON.stringify(metadataContent.substring(0, 100)));
          console.log('Last 100 chars:', JSON.stringify(metadataContent.substring(metadataContent.length - 100)));
          
          // Try to clean up any potential issues
          const cleanedContent = metadataContent.trim();
          console.log('Cleaned content length:', cleanedContent.length);
          
          metadata = JSON.parse(cleanedContent);
          console.log('Successfully parsed metadata');
          break;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Content that failed to parse (first 500 chars):', JSON.stringify(metadataContent.substring(0, 500)));
          
          return NextResponse.json({ 
            error: 'Invalid JSON in SaveGameMetadata file',
            details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }, { status: 400 });
        }
      }
    }

    if (!metadata) {
      return NextResponse.json({ error: 'No .SaveGameMetadata found in zip' }, { status: 400 });
    }

    // Find userId from email
    console.log('Finding user by email...');
    const users = await getUser(userEmail);
    const user = users && users[0];
    if (!user) {
      console.log('User not found for email:', userEmail);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('User found:', user.id);

    // Check city count limit (max 3 cities per user)
    console.log('Checking city count limit...');
    const cityCount = await getCityCountByUser(user.id);
    console.log('User has', cityCount, 'cities');
    if (cityCount >= 3) {
      console.log('City limit reached for user:', user.id);
      return NextResponse.json({ 
        error: 'City limit reached. You can only upload a maximum of 3 cities.' 
      }, { status: 400 });
    }

    // Upload .cok file to R2
    console.log('Uploading to R2...');
    const fileKey = generateFileKey('saves', originalName, user.id);
    console.log('Generated file key:', fileKey);
    const uploadResult = await uploadToR2(buffer, fileKey, 'application/octet-stream');
    console.log('Upload successful, key:', uploadResult.key);

    // Ensure City table exists
    console.log('Ensuring city table exists...');
    await ensureCityTableExists();

    // Generate unique city ID
    console.log('Generating unique city ID...');
    const cityId = await generateUniqueId(cityTable, cityTable.id);
    console.log('Generated city ID:', cityId);

    // Prepare city data for insertion
    const cityData = {
      id: cityId,
      userId: user.id,
      cityName: metadata.cityName,
      mapName: metadata.mapName,
      population: metadata.population,
      money: metadata.money,
      xp: metadata.xp,
      theme: metadata.theme,
      preview: metadata.preview,
      saveGameData: metadata.saveGameData,
      sessionGuid: metadata.sessionGuid,
      gameMode: metadata.gameMode,
      autoSave: metadata.autoSave,
      leftHandTraffic: metadata.options?.leftHandTraffic,
      naturalDisasters: metadata.options?.naturalDisasters,
      unlockAll: metadata.options?.unlockAll,
      unlimitedMoney: metadata.options?.unlimitedMoney,
      unlockMapTiles: metadata.options?.unlockMapTiles,
      simulationDate: metadata.simulationDate,
      contentPrerequisites: metadata.contentPrerequisites,
      modsEnabled: metadata.modsEnabled,
      fileName: originalName,
      filePath: uploadResult.key, // Store the R2 key instead of local path
    };

    // Insert city into database
    console.log('Inserting city into database...');
    const inserted = await db.insert(cityTable).values(cityData).returning();
    console.log('City inserted successfully:', inserted[0].id);

    // Invalidate home page cache since new city was added
    await invalidateHomePageCache();

    // Notify followers of the new city upload
    try {
      await notifyFollowersOfNewCity(user.id, inserted[0].id, metadata.cityName);
    } catch (notificationError) {
      console.error('Failed to notify followers:', notificationError);
      // Don't fail the upload if notification fails
    }

    return NextResponse.json({ city: inserted[0] });
    
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 