import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getCityById, getOsmMapCache, saveOsmMapCache } from '../../../../db';
import { DOMParser } from '@xmldom/xmldom';

interface OsmBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface OsmNode {
  id: string;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OsmWay {
  id: string;
  nodes: string[];
  tags?: Record<string, string>;
}

interface OsmData {
  bounds?: OsmBounds;
  nodes: OsmNode[];
  ways: OsmWay[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    // Get city info
    const city = await getCityById(cityId);
    if (!city || !city.osmMapPath) {
      return NextResponse.json({ error: 'City not found or no OSM map available' }, { status: 404 });
    }

    // Check if we have cached data
    const cachedData = await getOsmMapCache(cityId, city.osmMapPath);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData.processedData,
        bounds: cachedData.bounds,
        cached: true,
        nodeCount: cachedData.nodeCount,
        wayCount: cachedData.wayCount
      });
    }

    // If no cache, process the OSM file
    console.log('Processing OSM file for city:', cityId);
    
    try {
      // Fetch OSM data from the URL
      const response = await fetch(city.osmMapPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch OSM file: ${response.status}`);
      }
      
      const osmText = await response.text();
      
      // Parse OSM XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(osmText, 'text/xml');
      
      if (!xmlDoc.documentElement || xmlDoc.documentElement.nodeName !== 'osm') {
        throw new Error('Invalid OSM file format');
      }

      // Extract bounds
      const boundsElements = xmlDoc.documentElement.getElementsByTagName('bounds');
      let bounds: OsmBounds | undefined;
      if (boundsElements.length > 0) {
        const boundsElement = boundsElements[0];
        bounds = {
          minLat: parseFloat(boundsElement.getAttribute('minlat') || '0'),
          maxLat: parseFloat(boundsElement.getAttribute('maxlat') || '0'),
          minLng: parseFloat(boundsElement.getAttribute('minlon') || '0'),
          maxLng: parseFloat(boundsElement.getAttribute('maxlon') || '0')
        };
      }

      // Extract nodes
      const nodeElements = xmlDoc.documentElement.getElementsByTagName('node');
      const nodes: OsmNode[] = [];
      const nodeMap = new Map<string, OsmNode>();
      
      for (let i = 0; i < nodeElements.length; i++) {
        const nodeElement = nodeElements[i];
        const id = nodeElement.getAttribute('id') || '';
        const lat = parseFloat(nodeElement.getAttribute('lat') || '0');
        const lon = parseFloat(nodeElement.getAttribute('lon') || '0');
        
        const node: OsmNode = { id, lat, lon };
        
        // Parse tags
        const tagElements = nodeElement.getElementsByTagName('tag');
        if (tagElements.length > 0) {
          node.tags = {};
          for (let j = 0; j < tagElements.length; j++) {
            const tagElement = tagElements[j];
            const key = tagElement.getAttribute('k') || '';
            const value = tagElement.getAttribute('v') || '';
            if (key && value) {
              node.tags![key] = value;
            }
          }
        }
        
        nodes.push(node);
        nodeMap.set(id, node);
      }

      // Extract ways
      const wayElements = xmlDoc.documentElement.getElementsByTagName('way');
      const ways: OsmWay[] = [];
      
      for (let i = 0; i < wayElements.length; i++) {
        const wayElement = wayElements[i];
        const id = wayElement.getAttribute('id') || '';
        const way: OsmWay = { id, nodes: [] };
        
        // Get node references
        const ndElements = wayElement.getElementsByTagName('nd');
        for (let j = 0; j < ndElements.length; j++) {
          const ndElement = ndElements[j];
          const ref = ndElement.getAttribute('ref') || '';
          if (ref) {
            way.nodes.push(ref);
          }
        }
        
        // Parse tags
        const tagElements = wayElement.getElementsByTagName('tag');
        if (tagElements.length > 0) {
          way.tags = {};
          for (let j = 0; j < tagElements.length; j++) {
            const tagElement = tagElements[j];
            const key = tagElement.getAttribute('k') || '';
            const value = tagElement.getAttribute('v') || '';
            if (key && value) {
              way.tags![key] = value;
            }
          }
        }
        
        ways.push(way);
      }

      const processedData: OsmData = {
        bounds,
        nodes,
        ways
      };

      // Cache the processed data
      await saveOsmMapCache(cityId, city.osmMapPath, processedData, bounds);

      return NextResponse.json({
        success: true,
        data: processedData,
        bounds,
        cached: false,
        nodeCount: nodes.length,
        wayCount: ways.length
      });

    } catch (error) {
      console.error('Error processing OSM file:', error);
      return NextResponse.json({ 
        error: 'Failed to process OSM file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('OSM data API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 