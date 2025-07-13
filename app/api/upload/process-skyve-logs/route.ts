import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'File must be a ZIP file' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Read the zip file
    const arrayBuffer = await file.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));

    // Look for Skyve/CompatibilityReport.json in the zip (try both forward and back slashes)
    let compatibilityReportEntry = zip.getEntry('Skyve/CompatibilityReport.json');
    if (!compatibilityReportEntry) {
      compatibilityReportEntry = zip.getEntry('Skyve\\CompatibilityReport.json');
    }
    
    if (!compatibilityReportEntry) {
      return NextResponse.json({ 
        error: 'CompatibilityReport.json not found in Skyve folder. Please make sure you are uploading the correct Skyve logs ZIP file.'
      }, { status: 400 });
    }

    // Read the CompatibilityReport.json content
    const compatibilityReportContent = compatibilityReportEntry.getData().toString('utf8');
    
    // Parse the compatibility report
    const mods = parseCompatibilityReport(compatibilityReportContent);

    return NextResponse.json({ 
      success: true, 
      mods: mods,
      modCount: mods.length
    });

  } catch (error) {
    console.error('Error processing Skyve logs:', error);
    return NextResponse.json({ 
      error: 'Failed to process Skyve logs file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

interface ModInfo {
  id: string;
  name: string;
  version?: string;
  notes?: string[];
}

interface CompatibilityReportItem {
  Id: number;
  Name: string;
  Url: string;
  ReportItems: {
    PackageId: number;
    PackageName: string | null;
    Type: number;
    LocaleKey: string | null;
    LocaleParams: any[] | null;
    PackageReferences: any[];
    StatusDTO: {
      Action: number;
      Packages: any[];
      Header: string | null;
      Note: string | null;
      IntType: number;
      Type: string;
    };
  }[];
}

function parseCompatibilityReport(content: string): ModInfo[] {
  try {
    const reportData: CompatibilityReportItem[] = JSON.parse(content);
    const mods: ModInfo[] = [];

    for (const item of reportData) {
      // Extract notes from ReportItems that have non-empty notes
      const notes: string[] = [];
      
      for (const reportItem of item.ReportItems) {
        if (reportItem.StatusDTO.Note && reportItem.StatusDTO.Note.trim() !== '') {
          notes.push(reportItem.StatusDTO.Note.trim());
        }
      }

      // Remove duplicate notes
      const uniqueNotes = Array.from(new Set(notes));

      mods.push({
        id: item.Id.toString(),
        name: item.Name,
        version: undefined, // Version info not available in compatibility report
        notes: uniqueNotes.length > 0 ? uniqueNotes : undefined
      });
    }

    return mods;
  } catch (error) {
    console.error('Error parsing compatibility report:', error);
    throw new Error('Failed to parse compatibility report JSON');
  }
} 