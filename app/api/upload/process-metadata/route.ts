import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { cityTable, getUser, db, ensureCityTableExists, generateUniqueId } from 'app/db';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  console.log('Processing metadata request received');
  
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      console.log('No user email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { key, fileName } = await request.json();

    if (!key || !fileName) {
      return NextResponse.json({ error: 'Missing key or fileName' }, { status: 400 });
    }

    console.log('Processing file:', fileName, 'with key:', key);

    // Download file from R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 });
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
    console.log('File downloaded, size:', buffer.length);

    // Process the zip to extract metadata
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let metadata = null;

    console.log('Found', zipEntries.length, 'entries in zip');

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.SaveGameMetadata')) {
        console.log('Found metadata file:', entry.entryName);
        try {
          const metadataContent = entry.getData().toString('utf8');
          console.log('Metadata content length:', metadataContent.length);
          
          const cleanedContent = metadataContent.trim();
          metadata = JSON.parse(cleanedContent);
          console.log('Successfully parsed metadata');
          break;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
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

    // Ensure City table exists
    await ensureCityTableExists();

    // Generate unique city ID
    const cityId = await generateUniqueId(cityTable, cityTable.id);

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
      fileName: fileName,
      filePath: key, // Store the R2 key
    };

    console.log('Inserting city into database...');
    const inserted = await db.insert(cityTable).values(cityData).returning();
    console.log('City inserted successfully:', inserted[0].id);

    return NextResponse.json({ city: inserted[0] });
    
  } catch (error) {
    console.error('Metadata processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process metadata', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 