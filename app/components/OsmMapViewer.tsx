'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

interface OsmMapViewerProps {
  osmMapPath: string;
  cityName?: string;
}

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

export function OsmMapViewer({ osmMapPath, cityName }: OsmMapViewerProps) {
  const [osmData, setOsmData] = useState<OsmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(15);
  const [nodeMap, setNodeMap] = useState<Map<string, OsmNode>>(new Map());

  useEffect(() => {
    const loadOsmData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the OSM file
        const response = await fetch(osmMapPath);
        if (!response.ok) {
          throw new Error('Failed to load OSM data');
        }

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Parse OSM data
        const bounds = xmlDoc.querySelector('bounds');
        const nodes = Array.from(xmlDoc.querySelectorAll('node')).map(node => ({
          id: node.getAttribute('id') || '',
          lat: parseFloat(node.getAttribute('lat') || '0'),
          lon: parseFloat(node.getAttribute('lon') || '0'),
          tags: parseTags(node)
        }));

        const ways = Array.from(xmlDoc.querySelectorAll('way')).map(way => ({
          id: way.getAttribute('id') || '',
          nodes: Array.from(way.querySelectorAll('nd')).map(nd => nd.getAttribute('ref') || ''),
          tags: parseTags(way)
        }));

        const data: OsmData = { nodes, ways };

        // Create node map for quick lookup
        const nodeMapData = new Map<string, OsmNode>();
        nodes.forEach(node => nodeMapData.set(node.id, node));
        setNodeMap(nodeMapData);

        // Set bounds if available
        if (bounds) {
          data.bounds = {
            minLat: parseFloat(bounds.getAttribute('minlat') || '0'),
            maxLat: parseFloat(bounds.getAttribute('maxlat') || '0'),
            minLng: parseFloat(bounds.getAttribute('minlon') || '0'),
            maxLng: parseFloat(bounds.getAttribute('maxlon') || '0')
          };
        } else {
          // Calculate bounds from nodes if not provided
          if (nodes.length > 0) {
            const lats = nodes.map(n => n.lat);
            const lons = nodes.map(n => n.lon);
            data.bounds = {
              minLat: Math.min(...lats),
              maxLat: Math.max(...lats),
              minLng: Math.min(...lons),
              maxLng: Math.max(...lons)
            };
          }
        }

        setOsmData(data);

        // Calculate map center and zoom for custom map
        if (data.bounds) {
          const centerLat = (data.bounds.minLat + data.bounds.maxLat) / 2;
          const centerLng = (data.bounds.minLng + data.bounds.maxLng) / 2;
          
          // Ensure we have valid coordinates
          if (!isNaN(centerLat) && !isNaN(centerLng) && isFinite(centerLat) && isFinite(centerLng)) {
            setMapCenter([centerLat, centerLng]);
            
            // For custom maps, use moderate zoom levels
            const latDiff = Math.abs(data.bounds.maxLat - data.bounds.minLat);
            const lngDiff = Math.abs(data.bounds.maxLng - data.bounds.minLng);
            const maxDiff = Math.max(latDiff, lngDiff);
            
            let zoom = 13;
            if (maxDiff > 1) zoom = 10;
            else if (maxDiff > 0.1) zoom = 12;
            else if (maxDiff > 0.01) zoom = 14;
            else if (maxDiff > 0.001) zoom = 16;
            else zoom = 18;
            
            setMapZoom(zoom);
          } else {
            // Fallback coordinates
            setMapCenter([0, 0]);
            setMapZoom(13);
          }
        } else if (nodes.length > 0) {
          // Use first valid node as center if no bounds
          const firstNode = nodes.find(n => !isNaN(n.lat) && !isNaN(n.lon) && isFinite(n.lat) && isFinite(n.lon));
          if (firstNode) {
            setMapCenter([firstNode.lat, firstNode.lon]);
          } else {
            setMapCenter([0, 0]);
          }
          setMapZoom(13);
        } else {
          // Ultimate fallback
          setMapCenter([0, 0]);
          setMapZoom(13);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load OSM data');
      } finally {
        setIsLoading(false);
      }
    };

    if (osmMapPath) {
      loadOsmData();
    }
  }, [osmMapPath]);

  const parseTags = (element: Element): Record<string, string> => {
    const tags: Record<string, string> = {};
    element.querySelectorAll('tag').forEach(tag => {
      const key = tag.getAttribute('k');
      const value = tag.getAttribute('v');
      if (key && value) {
        tags[key] = value;
      }
    });
    return tags;
  };

  const createPolygonFromWay = (way: OsmWay): [number, number][] | null => {
    const wayNodes = way.nodes
      .map(nodeId => nodeMap.get(nodeId))
      .filter(node => node !== undefined);
    
    if (wayNodes.length < 3) return null; // Need at least 3 points for a polygon
    
    return wayNodes.map(node => [node!.lat, node!.lon] as [number, number]);
  };

  const createLineFromWay = (way: OsmWay): [number, number][] | null => {
    const wayNodes = way.nodes
      .map(nodeId => nodeMap.get(nodeId))
      .filter(node => node !== undefined);
    
    if (wayNodes.length < 2) return null; // Need at least 2 points for a line
    
    return wayNodes.map(node => [node!.lat, node!.lon] as [number, number]);
  };

  // Create custom icon based on POI type
  const createCustomIcon = (tags: Record<string, string>) => {
    // We'll use a dynamic import to avoid SSR issues
    if (typeof window === 'undefined') return undefined;
    
    const L = require('leaflet');
    
    const iconSize = 20;
    let iconSvg = '';
    let bgColor = '#6B7280';
    
    // Transport icons
    if (tags.highway === 'bus_stop' || tags.public_transport === 'platform' || 
        tags.railway === 'station' || tags.public_transport === 'station' ||
        tags.railway === 'platform' || tags.aeroway === 'aerodrome' ||
        tags.amenity === 'bus_station' || tags.amenity === 'taxi') {
      bgColor = '#4F46E5';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚌</text>
      </svg>`;
    } else if (tags.amenity === 'hospital') {
      bgColor = '#EF4444';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🏥</text>
      </svg>`;
    } else if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') {
      bgColor = '#059669';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🎓</text>
      </svg>`;
    } else if (tags.amenity === 'police') {
      bgColor = '#1E40AF';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">👮</text>
      </svg>`;
    } else if (tags.amenity === 'fire_station') {
      bgColor = '#DC2626';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚒</text>
      </svg>`;
    } else if (tags.amenity === 'parking') {
      bgColor = '#3B82F6';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🅿️</text>
      </svg>`;
    } else if (tags.amenity === 'bank') {
      bgColor = '#6366F1';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🏦</text>
      </svg>`;

    } else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') {
      bgColor = '#F59E0B';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🍽️</text>
      </svg>`;
    } else if (tags.shop) {
      bgColor = '#F59E0B';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🛒</text>
      </svg>`;
    } else if (tags.tourism) {
      bgColor = '#10B981';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🏛️</text>
      </svg>`;
    } else {
      // Default icon
      bgColor = '#6B7280';
      iconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" fill="currentColor"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>`;
    }
    
    const iconHtml = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        color: ${bgColor};
      ">
        ${iconSvg}
      </div>
    `;
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-poi-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load map</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!osmData || osmData.nodes.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No map data available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            This OSM file doesn&apos;t contain any map data
          </p>
        </div>
      </div>
    );
  }

  // Categorize ways based on OSMExport.mrules
  const landUseWays = osmData.ways.filter(way => {
    const tags = way.tags || {};
    return tags.landuse || tags.leisure || tags.natural || tags.amenity === 'parking';
  });

  const buildingWays = osmData.ways.filter(way => {
    const tags = way.tags || {};
    return tags.building;
  });

  // Create a function to determine building color based on context
  const getBuildingColorWithContext = (buildingTags: Record<string, string>, buildingPositions: [number, number][]) => {
    // First check for specific building types
    if (buildingTags.amenity === 'school' || buildingTags.amenity === 'university' || buildingTags.amenity === 'college') return '#F0F0D8';
    if (buildingTags.amenity === 'hospital') return '#FFE5E5';
    if (buildingTags.amenity === 'fire_station') return '#FF9999';
    if (buildingTags.amenity === 'police') return '#9999FF';
    if (buildingTags.amenity === 'bank') return '#E0E7FF';
    if (buildingTags.amenity === 'restaurant' || buildingTags.amenity === 'cafe' || buildingTags.amenity === 'fast_food') return '#FEF3C7';
    
    // Zoning-based building colors (Cities: Skylines 2 style)
    if (buildingTags.building === 'commercial') return '#FF9999'; // Light blue for commercial zoning
    if (buildingTags.building === 'residential') return '#FF9999'; // Light green for residential zoning
    if (buildingTags.building === 'industrial') return '#FF9999'; // Light yellow for industrial zoning
    
    // Other commercial buildings (shops, offices, etc.)
    if (buildingTags.shop || buildingTags.office || buildingTags.building === 'retail') return '#DBEAFE'; // Light blue
    
    // Other industrial buildings
    if (buildingTags.building === 'warehouse' || buildingTags.building === 'factory') return '#FEF3C7'; // Light yellow
    
    // Other residential buildings
    if (buildingTags.building === 'house' || buildingTags.building === 'apartments') return '#D1FAE5'; // Light green
    
    // For buildings with just building=yes, try to determine context from surrounding land use
    if (buildingTags.building === 'yes' || buildingTags.building === 'true' || !buildingTags.building) {
      // Calculate building center
      const centerLat = buildingPositions.reduce((sum, pos) => sum + pos[0], 0) / buildingPositions.length;
      const centerLng = buildingPositions.reduce((sum, pos) => sum + pos[1], 0) / buildingPositions.length;
      
      // Check if building is inside any land use area
      for (const landUseWay of landUseWays) {
        const landUsePositions = createPolygonFromWay(landUseWay);
        if (landUsePositions) {
          const landUseTags = landUseWay.tags || {};
          if (landUseTags.landuse === 'residential' && isPointInPolygon([centerLat, centerLng], landUsePositions)) {
            return '#D1FAE5'; // Light green for residential
          } else if ((landUseTags.landuse === 'commercial' || landUseTags.landuse === 'retail') && isPointInPolygon([centerLat, centerLng], landUsePositions)) {
            return '#DBEAFE'; // Light blue for commercial
          } else if (landUseTags.landuse === 'industrial' && isPointInPolygon([centerLat, centerLng], landUsePositions)) {
            return '#FEF3C7'; // Light yellow for industrial
          }
        }
      }
    }
    
    // Default building color
    return '#BCA9A9';
  };

  // Helper function to check if a point is inside a polygon
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]) => {
    const [lat, lng] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  const waterWays = osmData.ways.filter(way => {
    const tags = way.tags || {};
    return tags.waterway || tags.natural === 'water';
  });

  const roadWays = osmData.ways.filter(way => {
    const tags = way.tags || {};
    return tags.highway;
  });

  const railwayWays = osmData.ways.filter(way => {
    const tags = way.tags || {};
    return tags.railway;
  });

  const powerWays = osmData.ways.filter(way => {
    const tags = way.tags || {};
    return tags.power === 'line' || tags.power === 'minor_line';
  });

  // Categorize points based on OSMExport.mrules
  const importantNodes = osmData.nodes.filter(node => {
    const tags = node.tags || {};
    return tags.amenity || tags.shop || tags.leisure || tags.tourism || 
           tags.historic || tags.natural || tags.place || tags.power || 
           tags.highway === 'bus_stop' || tags.railway === 'station' ||
           tags.railway === 'platform' || tags.public_transport === 'station' ||
           tags.public_transport === 'platform' || tags.aeroway === 'aerodrome';
  });

  const getLandUseColor = (tags: Record<string, string>) => {
    // Based on OSMExport.mrules colors, updated for better building visibility
    if (tags.landuse === 'forest' || tags.natural === 'wood') return '#8DC56C';
    if (tags.landuse === 'residential') return '#D1FAE5'; // Light green for residential
    if (tags.landuse === 'commercial') return '#BFDBFE'; // Darker blue for commercial
    if (tags.landuse === 'industrial') return '#FEF3C7'; // Light yellow for industrial
    if (tags.landuse === 'retail') return '#BFDBFE'; // Darker blue for retail (similar to commercial)
    if (tags.leisure === 'park') return '#C0F6B0';
    if (tags.leisure === 'playground') return '#CCFEF0';
    if (tags.leisure === 'pitch') return '#89D2AE';
    if (tags.landuse === 'grass' || tags.natural === 'grass') return '#CFECA8';
    if (tags.amenity === 'parking') return '#F6EEB7';
    if (tags.landuse === 'farmland') return '#e9d8be';
    if (tags.landuse === 'farm') return '#E9D8BD';
    if (tags.landuse === 'orchard') return '#9fd790';
    if (tags.natural === 'water') return '#B5D0D0';
    if (tags.natural === 'beach') return '#FEFEC0';
    if (tags.landuse === 'cemetery') return '#A9CAAE';
    if (tags.landuse === 'military') return '#FE9898';
    if (tags.landuse === 'quarry') return '#FFFFFF';
    return '#E0E0E0'; // Default
  };

  const getBuildingColor = (tags: Record<string, string>) => {
    // Special amenity buildings get their own colors
    if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') return '#F0F0D8';
    if (tags.amenity === 'hospital') return '#FFE5E5';
    if (tags.amenity === 'fire_station') return '#FF9999';
    if (tags.amenity === 'police') return '#9999FF';
    if (tags.amenity === 'bank') return '#E0E7FF';
    if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') return '#FEF3C7';
    
    // Commercial buildings (shops, offices, etc.)
    if (tags.shop || tags.office || tags.building === 'commercial' || tags.building === 'retail') return '#DBEAFE'; // Light blue
    
    // Industrial buildings
    if (tags.building === 'industrial' || tags.building === 'warehouse' || tags.building === 'factory') return '#FEF3C7'; // Light yellow
    
    // Residential buildings
    if (tags.building === 'residential' || tags.building === 'house' || tags.building === 'apartments') return '#D1FAE5'; // Light green
    
    // For buildings with just building=yes, we'll use a neutral color
    // The actual color will be determined by the land use area they're in
    if (tags.building === 'yes' || tags.building === 'true') return '#E5E7EB'; // Light gray
    
    // Default building color (for buildings without specific type tags)
    return '#BCA9A9';
  };

  const getRoadColor = (tags: Record<string, string>) => {
    // Based on OSMExport.mrules highway colors
    if (tags.highway === 'motorway' || tags.highway === 'motorway_link') return '#849BBD';
    if (tags.highway === 'trunk' || tags.highway === 'trunk_link') return '#96D296';
    if (tags.highway === 'primary' || tags.highway === 'primary_link') return '#ECA2A3';
    if (tags.highway === 'secondary' || tags.highway === 'secondary_link') return '#FDD6A4';
    if (tags.highway === 'tertiary' || tags.highway === 'tertiary_link') return '#FEFEB2';
    if (tags.highway === 'residential' || tags.highway === 'unclassified') return '#FFFFFF';
    if (tags.highway === 'service') return '#FFFFFF';
    if (tags.highway === 'pedestrian') return '#EDEDED';
    if (tags.highway === 'footway') return '#F68474';
    if (tags.highway === 'cycleway') return '#0000FF';
    if (tags.highway === 'path') return '#6E7C6D';
    if (tags.highway === 'track') return '#9D7517';
    return '#CCCCCC';
  };

  const getRoadWidth = (tags: Record<string, string>) => {
    if (tags.highway === 'motorway' || tags.highway === 'motorway_link') return 8;
    if (tags.highway === 'trunk' || tags.highway === 'trunk_link') return 6;
    if (tags.highway === 'primary' || tags.highway === 'primary_link') return 5;
    if (tags.highway === 'secondary' || tags.highway === 'secondary_link') return 4;
    if (tags.highway === 'tertiary' || tags.highway === 'tertiary_link') return 3;
    if (tags.highway === 'residential' || tags.highway === 'unclassified') return 2;
    if (tags.highway === 'service') return 1;
    if (tags.highway === 'footway' || tags.highway === 'cycleway' || tags.highway === 'path') return 1;
    if (tags.highway === 'track') return 1;
    return 2;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Enhanced Cities: Skylines 2 Map */}
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-t-lg overflow-hidden">
        <MapContainer
          {...{
            center: mapCenter,
            zoom: mapZoom,
            style: { height: '100%', width: '100%' },
            scrollWheelZoom: true
          } as any}
        >
          {/* Base tile layer for coordinate system */}
          <TileLayer
            {...{
              url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
              opacity: 0
            } as any}
          />
          
          {/* Layer 1: Land Use Areas (background) */}
          {landUseWays.map(way => {
            const positions = createPolygonFromWay(way);
            if (!positions) return null;
            
            const tags = way.tags || {};
            const landUseColor = getLandUseColor(tags);
            
            return (
              <Polygon
                key={way.id}
                {...{
                  positions: positions,
                  pathOptions: {
                    fillColor: landUseColor,
                    fillOpacity: 0.7,
                    color: landUseColor,
                    weight: 1,
                    opacity: 0.8
                  }
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {tags.name || tags.landuse || tags.leisure || tags.natural || 'Land Use'}
                    </div>
                    <div className="text-gray-600">
                      Type: {tags.landuse || tags.leisure || tags.natural || 'Area'}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Color: {landUseColor}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          
          {/* Layer 2: Water Features */}
          {waterWays.map(way => {
            const positions = createLineFromWay(way);
            if (!positions) return null;
            
            const tags = way.tags || {};
            
            return (
              <Polyline
                key={way.id}
                {...{
                  positions: positions,
                  pathOptions: {
                    color: '#B5D0D0',
                    weight: tags.waterway === 'river' ? 4 : tags.waterway === 'stream' ? 2 : 6,
                    opacity: 0.8
                  }
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {tags.name || 'Water Feature'}
                    </div>
                    <div className="text-gray-600">Type: {tags.waterway || tags.natural || 'Water'}</div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Layer 3: Buildings */}
          {buildingWays.map(way => {
            const positions = createPolygonFromWay(way);
            if (!positions) return null;
            
            const tags = way.tags || {};
            const buildingColor = getBuildingColorWithContext(tags, positions);
            
            return (
              <Polygon
                key={way.id}
                {...{
                  positions: positions,
                  pathOptions: {
                    fillColor: buildingColor,
                    fillOpacity: 0.8,
                    color: '#666',
                    weight: 1,
                    opacity: 1
                  }
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {tags.name || tags.amenity || 'Building'}
                    </div>
                    <div className="text-gray-600">
                      Type: {tags.building || tags.amenity || 'Building'}
                    </div>
                    {tags.shop && (
                      <div className="text-gray-600">Shop: {tags.shop}</div>
                    )}
                    {tags.office && (
                      <div className="text-gray-600">Office: {tags.office}</div>
                    )}
                    <div className="text-gray-500 text-xs mt-1">
                      Color: {buildingColor}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Layer 4: Railways */}
          {railwayWays.map(way => {
            const positions = createLineFromWay(way);
            if (!positions) return null;
            
            const tags = way.tags || {};
            
            return (
              <Polyline
                key={way.id}
                {...{
                  positions: positions,
                  pathOptions: {
                    color: '#666666',
                    weight: tags.railway === 'rail' ? 3 : 2,
                    opacity: 0.9,
                    dashArray: tags.railway === 'rail' ? '10, 5' : undefined
                  }
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {tags.name || 'Railway'}
                    </div>
                    <div className="text-gray-600">Type: {tags.railway}</div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Layer 5: Power Lines */}
          {powerWays.map(way => {
            const positions = createLineFromWay(way);
            if (!positions) return null;
            
            const tags = way.tags || {};
            
            return (
              <Polyline
                key={way.id}
                {...{
                  positions: positions,
                  pathOptions: {
                    color: '#5c5c5c',
                    weight: tags.power === 'line' ? 2 : 1,
                    opacity: 0.7
                  }
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">Power Line</div>
                    <div className="text-gray-600">Type: {tags.power}</div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
          
          {/* Layer 6: Roads (top layer) */}
          {roadWays.map(way => {
            const positions = createLineFromWay(way);
            if (!positions) return null;
            
            const tags = way.tags || {};
            
            return (
              <Polyline
                key={way.id}
                {...{
                  positions: positions,
                  pathOptions: {
                    color: getRoadColor(tags),
                    weight: getRoadWidth(tags),
                    opacity: 0.9
                  }
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {tags.name || tags.highway || 'Road'}
                    </div>
                    <div className="text-gray-600">Type: {tags.highway}</div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
          
          {/* Layer 7: Points of Interest with Custom Icons */}
          {importantNodes.slice(0, 100).map(node => {
            const customIcon = createCustomIcon(node.tags || {});
            
            return (
              <Marker 
                key={node.id} 
                {...{ 
                  position: [node.lat, node.lon],
                  icon: customIcon
                } as any}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {node.tags?.name || node.tags?.amenity || node.tags?.shop || node.tags?.tourism || 'Location'}
                    </div>
                    {node.tags?.amenity && (
                      <div className="text-gray-600">Amenity: {node.tags.amenity}</div>
                    )}
                    {node.tags?.shop && (
                      <div className="text-gray-600">Shop: {node.tags.shop}</div>
                    )}
                    {node.tags?.tourism && (
                      <div className="text-gray-600">Tourism: {node.tags.tourism}</div>
                    )}
                    {node.tags?.leisure && (
                      <div className="text-gray-600">Leisure: {node.tags.leisure}</div>
                    )}
                    {node.tags?.highway === 'bus_stop' && (
                      <div className="text-gray-600">Transport: Bus Stop</div>
                    )}
                    {(node.tags?.railway === 'station' || node.tags?.public_transport === 'station') && (
                      <div className="text-gray-600">Transport: Railway Station</div>
                    )}
                    {node.tags?.aeroway && (
                      <div className="text-gray-600">Aeroway: {node.tags.aeroway}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>


    </div>
  );
} 