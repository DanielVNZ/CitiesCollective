import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getCityById, getOsmMapCache, saveOsmMapCache } from '../../../../db';

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

interface OsmRelation {
  id: string;
  members: Array<{
    type: 'way' | 'node' | 'relation';
    ref: string;
    role: string;
  }>;
  tags?: Record<string, string>;
}

interface OsmData {
  bounds?: OsmBounds;
  nodes: OsmNode[];
  ways: OsmWay[];
  relations?: OsmRelation[];
}

// Constants for limits  
const MAX_NODES = 1501000000000; // Limit nodes to prevent memory issues
const MAX_WAYS = 1000000000;  // Limit ways to prevent memory issues
const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB limit for XML parsing safety

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
      
      // Check content length if available
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error(`OSM file too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      }
      
      const osmText = await response.text();
      
      // Check actual file size
      if (osmText.length > MAX_FILE_SIZE) {
        throw new Error(`OSM file too large (${Math.round(osmText.length / 1024 / 1024)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      }
      
      console.log(`Starting processing of OSM file (${Math.round(osmText.length / 1024 / 1024)}MB)`);
      
      let nodeElements: any[];
      let wayElements: any[];
      let relationElements: any[];
      let bounds: OsmBounds | undefined;

      // Always use DOM parsing (like small cities) - disable streaming parser
      try {
        console.log('Using DOM parsing for all files...');
        const { DOMParser } = await import('@xmldom/xmldom');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(osmText, 'text/xml');
        
        if (xmlDoc.documentElement && xmlDoc.documentElement.nodeName === 'osm') {
          // Extract bounds
          const boundsElements = xmlDoc.documentElement.getElementsByTagName('bounds');
          if (boundsElements.length > 0) {
            const boundsElement = boundsElements[0];
            bounds = {
              minLat: parseFloat(boundsElement.getAttribute('minlat') || '0'),
              maxLat: parseFloat(boundsElement.getAttribute('maxlat') || '0'),
              minLng: parseFloat(boundsElement.getAttribute('minlon') || '0'),
              maxLng: parseFloat(boundsElement.getAttribute('maxlon') || '0')
            };
          }

          nodeElements = Array.from(xmlDoc.documentElement.getElementsByTagName('node'));
          wayElements = Array.from(xmlDoc.documentElement.getElementsByTagName('way'));
          relationElements = Array.from(xmlDoc.documentElement.getElementsByTagName('relation'));
          
          console.log(`DOM parsing successful: ${nodeElements.length} nodes, ${wayElements.length} ways, ${relationElements.length} relations`);
        } else {
          throw new Error('Invalid OSM file format');
        }
      } catch (domError) {
        console.error('DOM parsing failed:', domError);
        throw new Error(`Failed to parse OSM file: ${domError instanceof Error ? domError.message : 'Unknown error'}`);
      }

      // Process nodes directly from DOM elements
      const nodes: OsmNode[] = [];
      const nodeMap = new Map<string, OsmNode>();
      
      console.log(`Processing ${nodeElements.length} nodes...`);
      for (let i = 0; i < nodeElements.length && i < MAX_NODES; i++) {
        try {
          const nodeElement = nodeElements[i];
          const id = nodeElement.getAttribute('id') || '';
          const lat = parseFloat(nodeElement.getAttribute('lat') || '0');
          const lon = parseFloat(nodeElement.getAttribute('lon') || '0');
          
          // Skip invalid coordinates
          if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
            continue;
          }
          
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
        } catch (nodeError) {
          console.warn(`Error processing node ${i}:`, nodeError);
          continue;
        }
      }

      // Process ways directly from DOM elements
      const ways: OsmWay[] = [];
      
      console.log(`Processing ${wayElements.length} ways...`);
      for (let i = 0; i < wayElements.length && i < MAX_WAYS; i++) {
        try {
          const wayElement = wayElements[i];
          const id = wayElement.getAttribute('id') || '';
          const way: OsmWay = { id, nodes: [] };
          
          // Get node references
          const ndElements = wayElement.getElementsByTagName('nd');
          for (let j = 0; j < ndElements.length; j++) {
            const ndElement = ndElements[j];
            const ref = ndElement.getAttribute('ref') || '';
            if (ref && nodeMap.has(ref)) {
              way.nodes.push(ref);
            }
          }
          
          // Skip ways with no valid nodes
          if (way.nodes.length === 0) {
            continue;
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
        } catch (wayError) {
          console.warn(`Error processing way ${i}:`, wayError);
          continue;
        }
      }

      // Process relations for multipolygons (especially land/water areas)
      const relations: OsmRelation[] = [];
      
      console.log(`Processing ${relationElements.length} relations...`);
      for (let i = 0; i < relationElements.length; i++) {
        try {
          const relationElement = relationElements[i];
          const id = relationElement.getAttribute('id') || '';
          const relation: OsmRelation = { id, members: [] };
          
          // Get members
          const memberElements = relationElement.getElementsByTagName('member');
          for (let j = 0; j < memberElements.length; j++) {
            const memberElement = memberElements[j];
            const type = memberElement.getAttribute('type') as 'way' | 'node' | 'relation';
            const ref = memberElement.getAttribute('ref') || '';
            const role = memberElement.getAttribute('role') || '';
            if (type && ref) {
              relation.members.push({ type, ref, role });
            }
          }
          
          // Parse tags
          const tagElements = relationElement.getElementsByTagName('tag');
          if (tagElements.length > 0) {
            relation.tags = {};
            for (let j = 0; j < tagElements.length; j++) {
              const tagElement = tagElements[j];
              const key = tagElement.getAttribute('k') || '';
              const value = tagElement.getAttribute('v') || '';
              if (key && value) {
                relation.tags![key] = value;
              }
            }
          }
          
          // Only keep multipolygon relations and other relevant types
          if (relation.tags?.type === 'multipolygon' || 
              relation.tags?.type === 'boundary' ||
              relation.tags?.natural || 
              relation.tags?.landuse ||
              relation.tags?.leisure ||
              relation.tags?.amenity) {
            relations.push(relation);
          }
        } catch (relationError) {
          console.warn(`Error processing relation ${i}:`, relationError);
          continue;
        }
      }

      const processedData: OsmData = {
        bounds,
        nodes,
        ways,
        relations
      };

      console.log(`Successfully processed OSM data: ${nodes.length} nodes, ${ways.length} ways, ${relations.length} relations`);

      // Cache the processed data
      await saveOsmMapCache(cityId, city.osmMapPath, processedData, bounds);

      return NextResponse.json({
        success: true,
        data: processedData,
        bounds,
        cached: false,
        nodeCount: nodes.length,
        wayCount: ways.length,
        relationCount: relations.length,
        totalNodesInFile: nodeElements.length,
        totalWaysInFile: wayElements.length,
        totalRelationsInFile: relationElements.length,
        limited: nodeElements.length > MAX_NODES || wayElements.length > MAX_WAYS,
        processed: 'dom'
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