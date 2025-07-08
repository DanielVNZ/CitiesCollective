import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { cityTable, getUser, db, ensureCityTableExists, generateUniqueId } from 'app/db';
import { auth } from 'app/auth';
import { v4 as uuidv4 } from 'uuid';
import { uploadToR2, generateFileKey } from 'app/utils/r2';

// Multer setup for handling multipart/form-data
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get file data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name;
    const baseName = path.parse(originalName).name;
    
    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create temporary zip file for processing
    const tempZipPath = path.join(tempDir, `temp-${uuidv4()}.zip`);
    await fs.writeFile(tempZipPath, buffer as any);

    // Extract the zip to read metadata
    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();
    let metadata = null;
    let metadataContent = '';
    
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.SaveGameMetadata')) {
        try {
          metadataContent = entry.getData().toString('utf8');
          console.log('Raw metadata length:', metadataContent.length);
          console.log('First 100 chars:', JSON.stringify(metadataContent.substring(0, 100)));
          console.log('Last 100 chars:', JSON.stringify(metadataContent.substring(metadataContent.length - 100)));
          
          // Try to clean up any potential issues
          const cleanedContent = metadataContent.trim();
          console.log('Cleaned content length:', cleanedContent.length);
          
          metadata = JSON.parse(cleanedContent);
          break;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Content that failed to parse (first 500 chars):', JSON.stringify(metadataContent.substring(0, 500)));
          
          // Clean up temporary file on error
          await fs.unlink(tempZipPath).catch(() => {});
          
          return NextResponse.json({ 
            error: 'Invalid JSON in SaveGameMetadata file',
            details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }, { status: 400 });
        }
      }
    }

    // Clean up temporary zip file
    await fs.unlink(tempZipPath).catch(() => {});

    if (!metadata) {
      return NextResponse.json({ error: 'No .SaveGameMetadata found in zip' }, { status: 400 });
    }

    // Find userId from email
    const users = await getUser(userEmail);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upload .cok file to R2
    const fileKey = generateFileKey('saves', originalName, user.id);
    const uploadResult = await uploadToR2(buffer, fileKey, 'application/octet-stream');

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
      fileName: originalName,
      filePath: uploadResult.key, // Store the R2 key instead of local path
    };

    // Insert city into database
    const inserted = await db.insert(cityTable).values(cityData).returning();

    return NextResponse.json({ city: inserted[0] });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 