import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { cityTable, getUser, db, ensureCityTableExists } from 'app/db';
import { auth } from 'app/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.cok');
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.cok')) {
      cb(null, true);
    } else {
      cb(new Error('Only .cok files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get user
    const users = await getUser(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    // Check if city exists and belongs to user
    const existingCity = await db.select()
      .from(cityTable)
      .where(and(eq(cityTable.id, cityId), eq(cityTable.userId, user.id)))
      .limit(1);

    if (existingCity.length === 0) {
      return NextResponse.json({ error: 'City not found or access denied' }, { status: 404 });
    }

    const city = existingCity[0];

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.cok')) {
      return NextResponse.json({ error: 'Only .cok files are allowed' }, { status: 400 });
    }

    // Save the uploaded file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name;
    const baseName = path.parse(originalName).name;
    
    // Create uploads directory structure
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const savesDir = path.join(uploadsDir, 'saves');
    await fs.mkdir(savesDir, { recursive: true });
    
    // Generate unique filename for the .cok file
    const uniqueFileName = `${uuidv4()}-${baseName}.cok`;
    const kokFilePath = path.join(savesDir, uniqueFileName);
    const relativePath = `/uploads/saves/${uniqueFileName}`;
    
    // Save the original .cok file
    await fs.writeFile(kokFilePath, buffer);
    
    // Also create a temporary zip file for processing
    const tempZipPath = path.join(uploadsDir, `temp-${uuidv4()}.zip`);
    await fs.writeFile(tempZipPath, buffer);

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
          
          // Clean up files on error
          await fs.unlink(kokFilePath).catch(() => {});
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
      // Clean up .cok file if no metadata found
      await fs.unlink(kokFilePath).catch(() => {});
      return NextResponse.json({ error: 'No .SaveGameMetadata found in zip' }, { status: 400 });
    }
    
    // Update the city with new metadata
    const updatedCity = await db.update(cityTable)
      .set({
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
        filePath: relativePath, // Store the path to the .cok file
        updatedAt: new Date(),
      })
      .where(eq(cityTable.id, cityId))
      .returning();

    return NextResponse.json({ 
      success: true, 
      city: updatedCity[0],
      message: 'City updated successfully'
    });

  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

 