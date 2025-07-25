import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { cityTable, getUser, db, ensureCityTableExists, generateUniqueId, getCityCountByUser, notifyFollowersOfNewCity, upsertModCompatibility, getModCompatibility, updateCitiesWithModNotes } from 'app/db';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';
import { invalidateHomePageCache } from 'app/utils/cache-invalidation';

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

    const { key, fileName, downloadable = true, skyveMods = null } = await request.json();

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

    // Prepare mods data - use Skyve mods if provided, otherwise use metadata mods
    let modsEnabled = metadata.modsEnabled;
    let modsNotes = null;
    
    if (skyveMods && Array.isArray(skyveMods)) {
      // Convert Skyve mods to a special format that preserves the mod ID
      modsEnabled = skyveMods.map(mod => `${mod.id}: ${mod.name}`);
      
      // Process each mod for caching and note extraction
      const notesData: { [key: string]: string[] } = {};
      const modUpdatePromises = skyveMods.map(async (mod) => {
        // Check if mod exists in cache
        const cachedMod = await getModCompatibility(mod.id);
        
        // Check if notes have changed
        const newNotes = mod.notes || [];
        const cachedNotes = cachedMod?.notes || [];
        
        // Compare notes arrays
        const notesChanged = JSON.stringify(newNotes) !== JSON.stringify(cachedNotes);
        
        if (!cachedMod) {
          // New mod - add to cache
          await upsertModCompatibility(mod.id, mod.name, newNotes);
        } else if (notesChanged) {
          // Existing mod with changed notes - update cache and sync to other cities
          await upsertModCompatibility(mod.id, mod.name, newNotes);
          
          // Update all cities that use this mod with the new notes
          await updateCitiesWithModNotes(mod.id, newNotes);
        }
        
        // Store notes for this city
        if (newNotes.length > 0) {
          notesData[mod.id] = newNotes;
        }
      });
      
      // Wait for all mod updates to complete
      await Promise.all(modUpdatePromises);
      
      if (Object.keys(notesData).length > 0) {
        modsNotes = JSON.stringify(notesData);
      }
    }

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
      modsEnabled: modsEnabled,
      modsNotes: modsNotes,
      fileName: fileName,
      filePath: key, // Store the R2 key
      downloadable: downloadable,
    };

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
    console.error('Metadata processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process metadata', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 