'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

interface OsmMapViewerProps {
  osmMapPath: string;
  cityName?: string;
  cityId: number;
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

export function OsmMapViewer({ osmMapPath, cityName, cityId }: OsmMapViewerProps) {
  const [osmData, setOsmData] = useState<OsmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(15);
  const [nodeMap, setNodeMap] = useState<Map<string, OsmNode>>(new Map());
  const [dataLimited, setDataLimited] = useState(false);
  const [dataStats, setDataStats] = useState<{processed: number, total: number, type: string} | null>(null);
  const [renderProgress, setRenderProgress] = useState<{current: number, total: number} | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const loadOsmData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setRenderProgress(null);

        // Fetch processed OSM data from our caching API
        const response = await fetch(`/api/cities/${cityId}/osm-data`);
        if (!response.ok) {
          throw new Error(`Failed to fetch OSM data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load OSM data');
        }
        
        const { data, bounds, cached, limited, totalNodesInFile, totalWaysInFile, processed } = result;
        
        // Show warning if data was limited
        if (limited) {
          console.warn(`OSM data was limited: ${data.nodes.length}/${totalNodesInFile} nodes, ${data.ways.length}/${totalWaysInFile} ways processed`);
          setDataLimited(true);
          setDataStats({
            processed: data.nodes.length,
            total: totalNodesInFile,
            type: 'nodes'
          });
        } else {
          setDataLimited(false);
          setDataStats(null);
        }
        
        // Create node map for quick lookup
        const nodeMapData = new Map<string, OsmNode>();
        
        // Use iterative approach instead of forEach to prevent stack overflow
        const maxNodesToMap = Math.min(data.nodes.length, 50000); // Limit to prevent stack overflow
        for (let i = 0; i < maxNodesToMap; i++) {
          const node = data.nodes[i];
          nodeMapData.set(node.id, node);
        }
        setNodeMap(nodeMapData);

        // Set bounds if available
        if (bounds) {
          data.bounds = bounds;
        } else if (data.nodes.length > 0) {
          // Calculate bounds from nodes if not provided (with limits)
          const maxNodesForBounds = Math.min(data.nodes.length, 10000); // Limit for bounds calculation
          const lats: number[] = [];
          const lons: number[] = [];
          
          for (let i = 0; i < maxNodesForBounds; i++) {
            const node = data.nodes[i];
            lats.push(node.lat);
            lons.push(node.lon);
          }
          
          data.bounds = {
            minLat: Math.min(...lats),
            maxLat: Math.max(...lats),
            minLng: Math.min(...lons),
            maxLng: Math.max(...lons)
          };
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
        } else if (data.nodes.length > 0) {
          // Use first valid node as center if no bounds (iterative search)
          let firstNode = null;
          for (let i = 0; i < Math.min(data.nodes.length, 1000); i++) {
            const node = data.nodes[i];
            if (!isNaN(node.lat) && !isNaN(node.lon) && isFinite(node.lat) && isFinite(node.lon)) {
              firstNode = node;
              break;
            }
          }
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
  }, [osmMapPath, cityId]);







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







 // Render all POIs for full quality

  const getLandUseColor = (tags: Record<string, string>) => {
    // Following OSMExport.mrules area colors EXACTLY in the same order as the rules
    
    // Buildings (handled separately)
    if (tags.building) return '#BCA9A9';
    
    // Forest and woods
    if (tags.landuse === 'forest' || tags.natural === 'wood') return '#8DC56C';
    
    // Beach
    if (tags.natural === 'beach') return '#FEFEC0';
    
    // Farm areas
    if (tags.landuse === 'farm') return '#E9D8BD';
    if (tags.landuse === 'farmyard') return '#DCBE91';
    
    // Fell
    if (tags.natural === 'fell') return '#C5FF5B';
    
    // Academic areas  
    if (tags.amenity === 'university' || tags.amenity === 'college' || tags.amenity === 'school') return '#F0F0D8';
    
    // Residential
    if (tags.landuse === 'residential') return '#90EE90'; // Light green
    
    // Grass
    if (tags.landuse === 'grass') return '#CFECA8';
    
    // Allotments
    if (tags.landuse === 'allotments') return '#C8B084';
    
    // Meadow
    if (tags.natural === 'meadow' || tags.landuse === 'meadow') return '#CFECA8';
    
    // Nature reserve
    if (tags.leisure === 'nature_reserve') return '#ABDE96';
    
    // Car park
    if (tags.amenity === 'parking') return '#F6EEB7';
    
    // Parks and leisure
    if (tags.leisure === 'park') return '#C0F6B0';
    if (tags.leisure === 'garden') return '#CFECA8';
    if (tags.leisure === 'pitch') return '#89D2AE';
    if (tags.leisure === 'stadium') return '#33CC99';
    if (tags.leisure === 'track') return '#74DCBA';
    
    // Village green
    if (tags.landuse === 'village_green') return '#CFECA8';
    
    // Commercial and retail
    if (tags.landuse === 'retail' || tags.shop === 'yes') return '#F0D9D9';
    if (tags.landuse === 'industrial') return '#FFFFE0'; // Light yellow
    if (tags.office) return '#9932CC'; // Purple (Dark Orchid)
    if (tags.landuse === 'commercial') return '#87CEEB'; // Sky Blue
    
    // Graveyard
    if (tags.amenity === 'grave_yard' || tags.landuse === 'cemetery') return '#A9CAAE';
    
    // Military
    if (tags.landuse === 'military' || tags.military === 'barracks') return '#FE9898';
    
    // Aeroway
    if (tags.aeroway === 'apron' || tags.aeroway === 'terminal') return '#E9D1FE';
    
    // Orchard and farmland
    if (tags.landuse === 'orchard') return '#9fd790';
    if (tags.landuse === 'farmland') return '#e9d8be';
    
    // Quarry
    if (tags.landuse === 'quarry') return 'white';
    
    // Landfill
    if (tags.landuse === 'landfill') return '#D3D3D3'; // Light grey
    
    // Glacier
    if (tags.natural === 'glacier') return '#DDECEC';
    
    // Pedestrian areas
    if (tags.highway === 'pedestrian') return '#EDEDED';
    
    // National parks
    if (tags.boundary === 'national_park') return '#8DC56C';
    
    // Playground (special case)
    if (tags.leisure === 'playground') return '#CCFEF0';
    
    // Power substation (from rules)
    if (tags.power === 'substation') return '#DFD1D6';
    
    // Default - should not render (follows OSMExport.mrules "else stop" logic)
    return 'transparent';
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
      {/* Warning banner for limited data */}
      {dataLimited && dataStats && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Large map detected:</strong> This OSM file contains {dataStats.total.toLocaleString()} {dataStats.type}, but only {dataStats.processed.toLocaleString()} were processed to prevent performance issues.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Progressive rendering indicator */}
      {isRendering && renderProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Rendering map features...
                </p>
                <span className="text-sm text-blue-600 dark:text-blue-300">
                  {renderProgress.current} / {renderProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(renderProgress.current / renderProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Cities: Skylines 2 Map - Canvas Rendered */}
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-t-lg overflow-hidden">
        <MapContainer
          {...{
            center: mapCenter,
            zoom: mapZoom,
            style: { height: '100%', width: '100%' },
            scrollWheelZoom: true,
            preferCanvas: true, // Enable canvas rendering
            renderer: typeof window !== 'undefined' ? require('leaflet').canvas() : undefined
          } as any}
        >
          {/* Base tile layer for coordinate system */}
          <TileLayer
            {...{
              url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
              opacity: 0
            } as any}
          />
          
          {/* Canvas-based OSM Renderer */}
          <CanvasOsmRenderer 
            osmData={osmData}
            getLandUseColor={getLandUseColor}
            getBuildingColor={getBuildingColor}
            getRoadColor={getRoadColor}
            getRoadWidth={getRoadWidth}
            onRenderProgress={setRenderProgress}
            onRenderStart={() => setIsRendering(true)}
            onRenderComplete={() => {
              setIsRendering(false);
              setRenderProgress(null);
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
}

// Canvas-based OSM renderer component with advanced performance optimizations
function CanvasOsmRenderer({ 
  osmData, 
  getLandUseColor, 
  getBuildingColor, 
  getRoadColor, 
  getRoadWidth,
  onRenderProgress,
  onRenderStart,
  onRenderComplete
}: {
  osmData: OsmData;
  getLandUseColor: (tags: Record<string, string>) => string;
  getBuildingColor: (tags: Record<string, string>) => string;
  getRoadColor: (tags: Record<string, string>) => string;
  getRoadWidth: (tags: Record<string, string>) => number;
  onRenderProgress?: (progress: {current: number, total: number}) => void;
  onRenderStart?: () => void;
  onRenderComplete?: () => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!osmData || typeof window === 'undefined') return;
    
    const initializeMap = async () => {
    
    const L = require('leaflet');
    
    // Build node map for O(1) lookups (iterative to prevent stack overflow)
    const nodeMap = new Map<string, OsmNode>();
    
    // Process ALL nodes - no limits for full detail
    for (let i = 0; i < osmData.nodes.length; i++) {
      const node = osmData.nodes[i];
      nodeMap.set(node.id, node);
    }
    
    // Pre-process ways with positions for efficient rendering (iterative)
    const processedWays: any[] = [];
    
    // Process ALL ways - no limits for full detail
    // Use simple for loop instead of map to prevent stack overflow
    for (let i = 0; i < osmData.ways.length; i++) {
      const way = osmData.ways[i];
      const wayNodes: OsmNode[] = [];
      
      // Use simple for loop for way nodes
      for (let j = 0; j < way.nodes.length; j++) {
        const node = nodeMap.get(way.nodes[j]);
        if (node) {
          wayNodes.push(node);
        }
      }
      
      if (wayNodes.length === 0) continue;
      
      // Build positions array iteratively
      const positions: [number, number][] = [];
      for (let k = 0; k < wayNodes.length; k++) {
        positions.push([wayNodes[k].lat, wayNodes[k].lon]);
      }
      
      const processedWay = {
        ...way,
        nodes: wayNodes,
        positions: positions
      };
      
      processedWays.push(processedWay);
    }
    
    // Process multipolygon relations to create virtual ways for land/water areas
    const processMultipolygonRelations = (relations: OsmRelation[], ways: any[], wayMap: Map<string, any>): any[] => {
      const virtualWays: any[] = [];
      
      for (const relation of relations) {
        if (relation.tags?.type === 'multipolygon' && relation.tags) {
          // Get outer and inner ways
          const outerWays: any[] = [];
          const innerWays: any[] = [];
          
          for (const member of relation.members) {
            if (member.type === 'way') {
              const way = wayMap.get(member.ref);
              if (way) {
                if (member.role === 'outer') {
                  outerWays.push(way);
                } else if (member.role === 'inner') {
                  innerWays.push(way);
                }
              }
            }
          }
          
          // Create virtual ways for outer rings (these represent the main area)
          for (const outerWay of outerWays) {
            const virtualWay = {
              id: `relation_${relation.id}_outer_${outerWay.id}`,
              positions: outerWay.positions,
              tags: { ...relation.tags }, // Use relation tags for land use classification
              isFromRelation: true,
              relationId: relation.id
            };
            virtualWays.push(virtualWay);
          }
        }
      }
      
      return virtualWays;
    };
    
    // Create custom high-performance canvas layer
    const CanvasLayer = L.Layer.extend({
      initialize: function() {
        this._canvas = null;
        this._ctx = null;
        this._lastZoom = null;
        this._lastBounds = null;
        this._animationFrame = null;
        this._isDirty = true;
      },
      
             onAdd: function(map: any) {
         this._map = map;
         this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-layer');
         this._ctx = this._canvas.getContext('2d');
         
         // Enable hardware acceleration
         this._ctx.imageSmoothingEnabled = true;
         this._ctx.imageSmoothingQuality = 'high';
         
         // Set canvas size
         const size = map.getSize();
         this._canvas.width = size.x * (window.devicePixelRatio || 1);
         this._canvas.height = size.y * (window.devicePixelRatio || 1);
         this._canvas.style.width = size.x + 'px';
         this._canvas.style.height = size.y + 'px';
         this._ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
         
         // Position canvas
         L.DomUtil.setPosition(this._canvas, L.point(0, 0));
         
         // Add to map pane
         map.getPanes().overlayPane.appendChild(this._canvas);
         
         // Store rendered elements for click detection
         this._renderedElements = [];
         
         // Add click interactivity
         this._canvas.style.cursor = 'pointer';
         this._canvas.style.pointerEvents = 'auto';
         this._canvas.style.position = 'absolute';
         this._canvas.style.zIndex = '100';
         this._canvas.addEventListener('click', this._onCanvasClick.bind(this));
         this._canvas.addEventListener('mousemove', this._onCanvasMouseMove.bind(this));
         
         // Bind events for smooth interaction
         map.on('viewreset', this._onViewChange, this);
         map.on('zoom', this._onViewChange, this);
         map.on('move', this._onViewChange, this);
         map.on('zoomend', this._onViewChange, this);
         map.on('moveend', this._onViewChange, this);
         map.on('resize', this._onResize, this);
         
         // Initial render
         this._scheduleRender();
       },
      
             onRemove: function(map: any) {
         if (this._animationFrame) {
           cancelAnimationFrame(this._animationFrame);
         }
         
         // Remove click listeners
         this._canvas.removeEventListener('click', this._onCanvasClick);
         this._canvas.removeEventListener('mousemove', this._onCanvasMouseMove);
         
         L.DomUtil.remove(this._canvas);
         map.off('viewreset', this._onViewChange, this);
         map.off('zoom', this._onViewChange, this);
         map.off('move', this._onViewChange, this);
         map.off('zoomend', this._onViewChange, this);
         map.off('moveend', this._onViewChange, this);
         map.off('resize', this._onResize, this);
       },
       
       _onCanvasClick: function(e: MouseEvent) {
         // Account for canvas position and device pixel ratio
         const rect = this._canvas.getBoundingClientRect();
         const x = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
         const y = (e.clientY - rect.top) * (window.devicePixelRatio || 1);
         
         // Find clicked element
         const clickedElement = this._getElementAtPoint(x, y);
         
         if (clickedElement) {
           // Prevent event from bubbling to document
           e.stopPropagation();
           e.preventDefault();
           this._showPopup(clickedElement, e);
         }
       },
       
       _onCanvasMouseMove: function(e: MouseEvent) {
         const rect = this._canvas.getBoundingClientRect();
         const x = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
         const y = (e.clientY - rect.top) * (window.devicePixelRatio || 1);
         
         // Check if hovering over an interactive element
         const hoveredElement = this._getElementAtPoint(x, y);
         this._canvas.style.cursor = hoveredElement ? 'pointer' : 'grab';
       },
       
       _getElementAtPoint: function(x: number, y: number) {
         // Check rendered elements for hit detection
         for (let i = this._renderedElements.length - 1; i >= 0; i--) {
           const element = this._renderedElements[i];
           
           if (element.type === 'poi') {
             // Check if click is within POI circle
             const distance = Math.sqrt(
               Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)
             );
             if (distance <= element.radius + 5) { // 5px tolerance
               return element;
             }
           } else if (element.type === 'building' || element.type === 'landuse') {
             // Check if point is inside polygon
             if (this._pointInPolygon(x, y, element.points)) {
               return element;
             }
           } else if (element.type === 'road' || element.type === 'railway' || element.type === 'water') {
             // Check if click is near line
             if (this._pointNearLine(x, y, element.points, element.width + 5)) {
               return element;
             }
           }
         }
         return null;
       },
       
       _pointInPolygon: function(x: number, y: number, polygon: Array<{x: number, y: number}>) {
         let inside = false;
         for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
           if (((polygon[i].y > y) !== (polygon[j].y > y)) &&
               (x < (polygon[j].x - polygon[i].x) * (y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
             inside = !inside;
           }
         }
         return inside;
       },
       
       _pointNearLine: function(x: number, y: number, line: Array<{x: number, y: number}>, tolerance: number) {
         for (let i = 0; i < line.length - 1; i++) {
           const distance = this._distanceToLineSegment(x, y, line[i], line[i + 1]);
           if (distance <= tolerance) {
             return true;
           }
         }
         return false;
       },
       
       _distanceToLineSegment: function(px: number, py: number, p1: {x: number, y: number}, p2: {x: number, y: number}) {
         const A = px - p1.x;
         const B = py - p1.y;
         const C = p2.x - p1.x;
         const D = p2.y - p1.y;
         
         const dot = A * C + B * D;
         const lenSq = C * C + D * D;
         let param = -1;
         if (lenSq !== 0) {
           param = dot / lenSq;
         }
         
         let xx, yy;
         if (param < 0) {
           xx = p1.x;
           yy = p1.y;
         } else if (param > 1) {
           xx = p2.x;
           yy = p2.y;
         } else {
           xx = p1.x + param * C;
           yy = p1.y + param * D;
         }
         
         const dx = px - xx;
         const dy = py - yy;
         return Math.sqrt(dx * dx + dy * dy);
       },
       
       _showPopup: function(element: any, e: MouseEvent) {
         // Remove existing popup
         const existingPopup = document.getElementById('canvas-osm-popup');
         if (existingPopup) {
           existingPopup.remove();
         }
         
         // Create popup element
         const popup = document.createElement('div');
         popup.id = 'canvas-osm-popup';
         popup.style.cssText = `
           position: fixed;
           left: ${e.clientX + 10}px;
           top: ${e.clientY - 10}px;
           background: white;
           border: 1px solid #ccc;
           border-radius: 4px;
           padding: 8px;
           box-shadow: 0 2px 8px rgba(0,0,0,0.3);
           z-index: 10000;
           font-size: 12px;
           max-width: 200px;
           pointer-events: auto;
           color: black;
         `;
         
         // Generate popup content
         let content = '';
         const tags = element.tags || {};
         
         if (element.type === 'poi') {
           content = `
             <div style="font-weight: bold;">${tags.name || tags.amenity || tags.shop || tags.tourism || 'Location'}</div>
             ${tags.amenity ? `<div>Amenity: ${tags.amenity}</div>` : ''}
             ${tags.shop ? `<div>Shop: ${tags.shop}</div>` : ''}
             ${tags.tourism ? `<div>Tourism: ${tags.tourism}</div>` : ''}
           `;
         } else if (element.type === 'building') {
           content = `
             <div style="font-weight: bold;">${tags.name || tags.amenity || 'Building'}</div>
             <div>Type: ${tags.building || tags.amenity || 'Building'}</div>
             ${tags.shop ? `<div>Shop: ${tags.shop}</div>` : ''}
           `;
         } else if (element.type === 'road') {
           content = `
             <div style="font-weight: bold;">${tags.name || tags.highway || 'Road'}</div>
             <div>Type: ${tags.highway}</div>
             ${tags.maxspeed ? `<div>Speed limit: ${tags.maxspeed}</div>` : ''}
             ${tags.lanes ? `<div>Lanes: ${tags.lanes}</div>` : ''}
           `;
         } else if (element.type === 'railway') {
           content = `
             <div style="font-weight: bold;">${tags.name || tags.railway || 'Railway'}</div>
             <div>Type: ${tags.railway}</div>
           `;
         } else if (element.type === 'landuse') {
           content = `
             <div style="font-weight: bold;">${tags.name || tags.landuse || tags.leisure || tags.natural || 'Land Use'}</div>
             <div>Type: ${tags.landuse || tags.leisure || tags.natural || 'Area'}</div>
           `;
         } else if (element.type === 'water') {
           content = `
             <div style="font-weight: bold;">${tags.name || tags.waterway || tags.natural || 'Water'}</div>
             <div>Type: ${tags.waterway || tags.natural || 'Water feature'}</div>
           `;
         } else if (element.type === 'power') {
           content = `
             <div style="font-weight: bold;">${tags.name || 'Power line'}</div>
             <div>Type: ${tags.power}</div>
           `;
         } else {
           content = `
             <div style="font-weight: bold;">${tags.name || element.type}</div>
             <div>Type: ${element.type}</div>
           `;
         }
         
         popup.innerHTML = content;
         
         // Prevent popup clicks from bubbling up and removing the popup
         popup.addEventListener('click', function(e) {
           e.stopPropagation();
         });
         
         document.body.appendChild(popup);
         
         // Auto-remove popup after 5 seconds or on next click
         setTimeout(() => {
           if (popup.parentNode) {
             popup.remove();
           }
         }, 5000);
         
         // Add click listener after a short delay to prevent immediate removal
         setTimeout(() => {
           function removePopup(event: Event) {
             if (popup.parentNode) {
               popup.remove();
               document.removeEventListener('click', removePopup);
             }
           }
           document.addEventListener('click', removePopup);
         }, 100);
       },
      
      _onViewChange: function() {
        this._isDirty = true;
        this._scheduleRender();
      },
      
      _onResize: function() {
        const size = this._map.getSize();
        this._canvas.width = size.x * (window.devicePixelRatio || 1);
        this._canvas.height = size.y * (window.devicePixelRatio || 1);
        this._canvas.style.width = size.x + 'px';
        this._canvas.style.height = size.y + 'px';
        this._ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        this._isDirty = true;
        this._scheduleRender();
      },
      
             _scheduleRender: function() {
         if (this._animationFrame) return;
         
         // Use requestAnimationFrame for smooth 60fps rendering
         this._animationFrame = requestAnimationFrame(() => {
           this._animationFrame = null;
           if (this._isDirty) {
             this._render();
             this._isDirty = false;
           }
         });
       },
      
             _render: function() {
         if (!this._ctx || !osmData) return;
         
         const ctx = this._ctx;
         const map = this._map;
         const zoom = map.getZoom();
         const bounds = map.getBounds();
         const size = map.getSize();
         
         // Position canvas correctly relative to map
         const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
         L.DomUtil.setPosition(this._canvas, topLeft);
         
         // Clear canvas
         ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
         
         // Add sea background color (following OSMExport.mrules map-sea-color)
         ctx.fillStyle = '#afb3b0'; // Light grey background for sea/ocean areas
         ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
         
         // Clear rendered elements for click detection
         this._renderedElements = [];
         
         // Use all processed ways (no viewport culling)
         const waysToRender = processedWays;
         
         // Create wayMap for relation processing
         const wayMap = new Map<string, any>();
         for (const way of waysToRender) {
           wayMap.set(way.id, way);
         }
         
         // Process multipolygon relations if available
         let virtualWays: any[] = [];
         if (osmData.relations && osmData.relations.length > 0) {
           virtualWays = processMultipolygonRelations(osmData.relations, waysToRender, wayMap);
         }
         
         // Combine regular ways with virtual ways from relations
         const allWaysToRender = [...waysToRender, ...virtualWays];
         
         // Level of detail optimizations based on number of features
         const totalFeatures = allWaysToRender.length + osmData.nodes.length;
         
         let renderedFeatures = 0;
         
         // Start progressive rendering
         if (onRenderStart) onRenderStart();
         
         // Level of Detail (LOD): adjust rendering based on zoom (more permissive)
         const isHighDetail = zoom >= 13;
         const isMediumDetail = zoom >= 10;
         const isLowDetail = zoom >= 6;
         
         // Helper function to convert lat/lng to canvas coordinates
         const latLngToCanvasPoint = (lat: number, lng: number) => {
           const layerPoint = map.latLngToLayerPoint([lat, lng]);
           const canvasPoint = {
             x: layerPoint.x - topLeft.x,
             y: layerPoint.y - topLeft.y
           };
           return canvasPoint;
         };
        
                 // Optimized drawing functions with batching and progress tracking
         const drawBatchedPolygons = (ways: any[], getColor: (tags: any) => string, strokeColor?: string, elementType: string = 'polygon') => {
           const colorGroups = new Map<string, any[]>();
           
           // Group by color for batching (iterative to prevent stack overflow)
           for (let i = 0; i < ways.length; i++) {
             const way = ways[i];
             
             // Skip if no positions
             if (!way.positions || way.positions.length === 0) {
               continue;
             }
             
             const color = getColor(way.tags || {});
             if (!colorGroups.has(color)) {
               colorGroups.set(color, []);
             }
             colorGroups.get(color)!.push(way);
           }
           
           // Render each color group in batch
           colorGroups.forEach((group, color) => {
             
             // Ensure proper canvas state for filling
             ctx.globalCompositeOperation = 'source-over';
             ctx.fillStyle = color;
             if (strokeColor) {
               ctx.strokeStyle = strokeColor;
               ctx.lineWidth = 1;
             }
             
             let polygonsDrawn = 0;
             
             for (let i = 0; i < group.length; i++) {
               const way = group[i];
               if (way.positions.length < 3) continue;
               
               // Build canvas points iteratively
               const canvasPoints: {x: number, y: number}[] = [];
               for (let j = 0; j < way.positions.length; j++) {
                 const pos = way.positions[j];
                 const point = latLngToCanvasPoint(pos[0], pos[1]);
                 canvasPoints.push({ x: point.x, y: point.y });
               }
               
               // Scale for click detection iteratively
               const scaledPoints: {x: number, y: number}[] = [];
               for (let j = 0; j < canvasPoints.length; j++) {
                 const point = canvasPoints[j];
                 scaledPoints.push({
                   x: point.x * (window.devicePixelRatio || 1),
                   y: point.y * (window.devicePixelRatio || 1)
                 });
               }
               
               ctx.beginPath();
               for (let j = 0; j < canvasPoints.length; j++) {
                 const point = canvasPoints[j];
                 if (j === 0) {
                   ctx.moveTo(point.x, point.y);
                 } else {
                   ctx.lineTo(point.x, point.y);
                 }
               }
               ctx.closePath();
               ctx.fill();
               if (strokeColor) ctx.stroke();
               
               polygonsDrawn++;
               
               // Store for click detection with scaled coordinates
               this._renderedElements.push({
                 type: elementType,
                 points: scaledPoints,
                 tags: way.tags || {},
                 way: way
               });
               
               // Update progress
               renderedFeatures++;
               if (onRenderProgress && totalFeatures > 0) {
                 onRenderProgress({ current: renderedFeatures, total: totalFeatures });
               }
             }
           });
         };
        
                 const drawBatchedLines = (ways: any[], getColor: (tags: any) => string, getWidth: (tags: any) => number, elementType: string = 'line') => {
           const styleGroups = new Map<string, any[]>();
           
           // Group by style for batching (iterative to prevent stack overflow)
           for (let i = 0; i < ways.length; i++) {
             const way = ways[i];
             const color = getColor(way.tags || {});
             const width = getWidth(way.tags || {});
             const styleKey = `${color}-${width}`;
             if (!styleGroups.has(styleKey)) {
               styleGroups.set(styleKey, []);
             }
             styleGroups.get(styleKey)!.push(way);
           }
           
           // Render each style group in batch
           styleGroups.forEach((group, styleKey) => {
             const [color, width] = styleKey.split('-');
             ctx.strokeStyle = color;
             ctx.lineWidth = parseInt(width);
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             
             for (let i = 0; i < group.length; i++) {
               const way = group[i];
               if (way.positions.length < 2) continue;
               
               // Build canvas points iteratively
               const canvasPoints: {x: number, y: number}[] = [];
               for (let j = 0; j < way.positions.length; j++) {
                 const pos = way.positions[j];
                 const point = latLngToCanvasPoint(pos[0], pos[1]);
                 canvasPoints.push({ x: point.x, y: point.y });
               }
               
               // Scale for click detection iteratively
               const scaledPoints: {x: number, y: number}[] = [];
               for (let j = 0; j < canvasPoints.length; j++) {
                 const point = canvasPoints[j];
                 scaledPoints.push({
                   x: point.x * (window.devicePixelRatio || 1),
                   y: point.y * (window.devicePixelRatio || 1)
                 });
               }
               
               ctx.beginPath();
               for (let j = 0; j < canvasPoints.length; j++) {
                 const point = canvasPoints[j];
                 if (j === 0) {
                   ctx.moveTo(point.x, point.y);
                 } else {
                   ctx.lineTo(point.x, point.y);
                 }
               }
               ctx.stroke();
               
               // Store for click detection with scaled coordinates
               this._renderedElements.push({
                 type: elementType,
                 points: scaledPoints,
                 width: parseInt(width),
                 tags: way.tags || {},
                 way: way
               });
               
               // Update progress
               renderedFeatures++;
               if (onRenderProgress && totalFeatures > 0) {
                 onRenderProgress({ current: renderedFeatures, total: totalFeatures });
               }
             }
           });
         };
        
                 // Filter visible ways by type for efficient rendering (iterative to prevent stack overflow)
         const visibleLandUse: any[] = [];
         const visibleBuildings: any[] = [];
         const visibleWater: any[] = [];
         const visibleRoads: any[] = [];
         const visibleRailways: any[] = [];
         const visiblePower: any[] = [];
         
         // Iteratively categorize ways to prevent stack overflow (following OSMExport.mrules exactly)
         for (let i = 0; i < allWaysToRender.length; i++) {
           const way = allWaysToRender[i];
           const tags = way.tags || {};
           
           // Water features - both areas and lines (from OSMExport.mrules) - handle first to avoid double categorization
           if (tags.natural === 'water' || tags.waterway === 'riverbank' || 
               tags.landuse === 'reservoir' || tags.landuse === 'basin' || 
               tags.waterway === 'dock' || tags.waterway === 'river' || 
               tags.waterway === 'stream' || tags.waterway === 'canal' || 
               tags.waterway === 'drain' || tags.natural === 'coastline' ||
               tags.place === 'sea' || tags.place === 'ocean' ||
               tags.man_made === 'pier' || tags['seamark:type'] === 'ferry_route' ||
               tags.natural === 'bay' || tags.natural === 'strait' || 
               tags.leisure === 'marina') {
             visibleWater.push(way);
           }
           // Land use and terrain features - following OSMExport.mrules areas section EXACTLY
           else if (
             // Natural areas
             tags.natural === 'beach' || tags.natural === 'wood' || tags.natural === 'fell' || 
             tags.natural === 'glacier' || tags.natural === 'meadow' || tags.natural === 'grass' ||
             
             // Land use areas  
             tags.landuse === 'village_green' || tags.landuse === 'forest' || tags.landuse === 'farm' ||
             tags.landuse === 'farmyard' || tags.landuse === 'grass' || tags.landuse === 'allotments' ||
             tags.landuse === 'meadow' || tags.landuse === 'retail' || tags.landuse === 'industrial' ||
             tags.landuse === 'commercial' || tags.landuse === 'residential' || tags.landuse === 'orchard' ||
             tags.landuse === 'farmland' || tags.landuse === 'quarry' || tags.landuse === 'landfill' ||
             tags.landuse === 'cemetery' || tags.landuse === 'military' ||
             
             // Leisure areas
             tags.leisure === 'nature_reserve' || tags.leisure === 'playground' || tags.leisure === 'track' ||
             tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'pitch' ||
             tags.leisure === 'stadium' ||
             
             // Amenity areas
             tags.amenity === 'parking' || tags.amenity === 'grave_yard' || 
             tags.amenity === 'university' || tags.amenity === 'college' || tags.amenity === 'school' ||
             
             // Boundaries
             tags.boundary === 'national_park' ||
             
             // Highway areas
             tags.highway === 'pedestrian' ||
             
             // Aeroway areas
             tags.aeroway === 'apron' || tags.aeroway === 'terminal' ||
             
             // Military
             tags.military === 'barracks' ||
             
             // Office
             tags.office ||
             
             // Power
             tags.power === 'substation' ||
             
             // Shop areas
             tags.shop === 'yes'
           ) {
             visibleLandUse.push(way);
           }
           
           // Buildings
           if (tags.building) {
             visibleBuildings.push(way);
           }
           
           // Roads
           if (tags.highway) {
             visibleRoads.push(way);
           }
           
           // Railways
           if (tags.railway) {
             visibleRailways.push(way);
           }
           
           // Power lines
           if (tags.power === 'line' || tags.power === 'minor_line') {
             visiblePower.push(way);
           }
         }
         
         // Render layers with LOD optimizations (always show core features)
         
         // Layer 1: Land Use Areas (always render for context)
         if (isLowDetail) {
           drawBatchedPolygons(visibleLandUse, getLandUseColor, undefined, 'landuse');
         }
         
         // Layer 2: Water Features (render at all zoom levels like OSMExport.mrules)
         if (isLowDetail) {
           
           let renderedWaterAreas = 0;
           let renderedWaterLines = 0;
           
           // Render water features (areas and waterways)
           for (let i = 0; i < visibleWater.length; i++) {
             const way = visibleWater[i];
             const tags = way.tags || {};
             
             if (way.positions && way.positions.length > 0) {
               // Convert positions to canvas points
               const canvasPoints: {x: number, y: number}[] = [];
               for (let j = 0; j < way.positions.length; j++) {
                 const pos = way.positions[j];
                 const point = latLngToCanvasPoint(pos[0], pos[1]);
                 canvasPoints.push({ x: point.x, y: point.y });
               }
               
               // Water areas (following OSMExport.mrules)
               if (tags.natural === 'water' || tags.waterway === 'riverbank' || 
                   tags.landuse === 'reservoir' || tags.landuse === 'basin' || 
                   tags.waterway === 'dock' || tags.place === 'sea' || 
                   tags.place === 'ocean' || tags.natural === 'bay' ||
                   tags.natural === 'strait' || tags.leisure === 'marina') {
                 
                 // Use a more visible blue color for water
                 ctx.fillStyle = '#2E86AB'; // Darker blue for water areas (lakes, rivers)
                 ctx.beginPath();
                 ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                 for (let j = 1; j < canvasPoints.length; j++) {
                   ctx.lineTo(canvasPoints[j].x, canvasPoints[j].y);
                 }
                 ctx.closePath();
                 ctx.fill();
                 
                 // Debug: Also add a blue stroke to make it more visible
                 ctx.strokeStyle = '#0066CC';
                 ctx.lineWidth = 2;
                 ctx.stroke();
                 
                 // Store for click detection with scaled coordinates
                 const scaledPoints = canvasPoints.map((point: {x: number, y: number}) => ({
                   x: point.x * (window.devicePixelRatio || 1),
                   y: point.y * (window.devicePixelRatio || 1)
                 }));
                 
                 this._renderedElements.push({
                   type: 'water',
                   points: scaledPoints,
                   tags: way.tags || {},
                   way: way
                 });
                 
                 renderedWaterAreas++;
               }
               
               // Water lines (following OSMExport.mrules) - separate check, not else if
               if (tags.waterway === 'river' || tags.waterway === 'stream' || 
                   tags.waterway === 'canal' || tags.waterway === 'drain' || 
                   tags.natural === 'coastline' || tags.man_made === 'pier' ||
                   tags['seamark:type'] === 'ferry_route') {
                 
                 // Set width based on waterway type (from OSMExport.mrules)
                 if (tags.waterway === 'river') {
                   ctx.lineWidth = 5; // rivers: line-width : 7:1;12:2;14:5
                 } else if (tags.waterway === 'stream') {
                   ctx.lineWidth = 2; // streams: line-width : 13:1;15:2
                 } else if (tags.waterway === 'canal') {
                   ctx.lineWidth = 4; // canals: line-width : 12:1;17:8
                 } else if (tags.waterway === 'drain') {
                   ctx.lineWidth = 1; // drains: line-width : 1
                 } else if (tags.natural === 'coastline') {
                   ctx.lineWidth = 2; // coastlines: line-width : 2
                 } else if (tags.man_made === 'pier') {
                   ctx.lineWidth = 3; // piers: line-width : 1:1;20:8 (simplified)
                   ctx.strokeStyle = '#F1EEE8'; // pier color from OSMExport.mrules
                 } else if (tags['seamark:type'] === 'ferry_route') {
                   ctx.lineWidth = 1; // ferry routes: line-width : 1
                   ctx.strokeStyle = '#6666FF'; // ferry color from OSMExport.mrules
                   ctx.setLineDash([10, 5]); // dashlong style
                 } else {
                   ctx.lineWidth = 2; // default for other waterways
                 }
                 
                 ctx.beginPath();
                 ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
                 for (let j = 1; j < canvasPoints.length; j++) {
                   ctx.lineTo(canvasPoints[j].x, canvasPoints[j].y);
                 }
                 ctx.stroke();
                 
                 // Reset dash pattern for next feature
                 ctx.setLineDash([]);
                 
                 renderedWaterLines++;
               }
             }
           }
           
         }
         
         // Layer 3: Buildings (full detail at all zoom levels)
         if (isMediumDetail) {
           // Always render ALL buildings for full detail
           drawBatchedPolygons(visibleBuildings, getBuildingColor, '#666', 'building');
         }
         
         // Layer 4: Railways (always render at low+ detail)
         if (isLowDetail) {
           visibleRailways.forEach(way => {
             const tags = way.tags || {};
             const width = tags.railway === 'rail' ? 3 : 2;
             
             if (tags.railway === 'rail') {
               ctx.setLineDash([10, 5]);
             } else {
               ctx.setLineDash([]);
             }
             
             const canvasPoints = way.positions.map((pos: [number, number]) => {
               const point = latLngToCanvasPoint(pos[0], pos[1]);
               return { x: point.x, y: point.y };
             });
             
             // Scale for click detection
             const scaledPoints = canvasPoints.map((point: {x: number, y: number}) => ({
               x: point.x * (window.devicePixelRatio || 1),
               y: point.y * (window.devicePixelRatio || 1)
             }));
             
             ctx.strokeStyle = '#666666';
             ctx.lineWidth = width;
             ctx.beginPath();
             canvasPoints.forEach((point: {x: number, y: number}, index: number) => {
               if (index === 0) {
                 ctx.moveTo(point.x, point.y);
               } else {
                 ctx.lineTo(point.x, point.y);
               }
             });
             ctx.stroke();
             ctx.setLineDash([]);
             
             // Store for click detection with scaled coordinates
             this._renderedElements.push({
               type: 'railway',
               points: scaledPoints,
               width: width,
               tags: way.tags || {},
               way: way
             });
           });
         }
         
         // Layer 5: Power Lines (medium+ detail)
         if (isMediumDetail) {
           drawBatchedLines(visiblePower, () => '#5c5c5c', (tags) => {
             return tags.power === 'line' ? 2 : 1;
           }, 'power');
         }
         
         // Layer 6: Roads (always render ALL roads for full detail)
         if (isLowDetail) {
           // Sort roads by importance (using simple sort to avoid potential stack issues)
           const sortedRoads = [...visibleRoads];
           sortedRoads.sort((a, b) => {
             const aImportance = getRoadImportance(a.tags || {});
             const bImportance = getRoadImportance(b.tags || {});
             return bImportance - aImportance; // Render important roads first
           });
           
           // Render ALL roads for full detail
           drawBatchedLines(sortedRoads, getRoadColor, getRoadWidth, 'road');
         }
        
                          // Layer 7: Points of Interest (show at medium+ detail)
         if (isMediumDetail) {
           const visibleNodes: any[] = [];
           // Find POI nodes iteratively
           for (let i = 0; i < osmData.nodes.length; i++) {
             const node = osmData.nodes[i];
             const tags = node.tags || {};
             if (tags.amenity || tags.shop || tags.leisure || tags.tourism || 
                 tags.historic || tags.natural || tags.place || tags.power || 
                 tags.highway === 'bus_stop' || tags.railway === 'station' ||
                 tags.railway === 'platform' || tags.public_transport === 'station' ||
                 tags.public_transport === 'platform' || tags.aeroway === 'aerodrome' ||
                 tags.place === 'sea' || tags.place === 'ocean') {
               visibleNodes.push(node);
             }
           }
          
          // Batch POI rendering by color (iterative)
          const poiColorGroups = new Map<string, any[]>();
          for (let i = 0; i < visibleNodes.length; i++) {
            const node = visibleNodes[i];
            const tags = node.tags || {};
            let color = '#6B7280';
            if (tags.amenity === 'hospital') color = '#EF4444';
            else if (tags.amenity === 'school' || tags.amenity === 'university') color = '#059669';
            else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') color = '#F59E0B';
            else if (tags.shop) color = '#F59E0B';
            else if (tags.tourism) color = '#10B981';
            else if (tags.highway === 'bus_stop' || tags.railway === 'station') color = '#4F46E5';
            else if (tags.place === 'sea' || tags.place === 'ocean') color = '#4A90E2'; // Water blue for large water bodies
            
            if (!poiColorGroups.has(color)) {
              poiColorGroups.set(color, []);
            }
            poiColorGroups.get(color)!.push(node);
          }
          
                     // Render POI groups iteratively
           poiColorGroups.forEach((nodes, color) => {
             ctx.fillStyle = color;
             ctx.strokeStyle = '#FFFFFF';
             ctx.lineWidth = 2;
             
             for (let i = 0; i < nodes.length; i++) {
               const node = nodes[i];
               const point = latLngToCanvasPoint(node.lat, node.lon);
               ctx.beginPath();
               ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
               ctx.fill();
               ctx.stroke();
               
               // Store for click detection with scaled coordinates
               this._renderedElements.push({
                 type: 'poi',
                 x: point.x * (window.devicePixelRatio || 1),
                 y: point.y * (window.devicePixelRatio || 1),
                 radius: 6 * (window.devicePixelRatio || 1),
                 tags: node.tags || {},
                 node: node
               });
               
                                // Update progress
                 renderedFeatures++;
                 if (onRenderProgress && totalFeatures > 0) {
                   onRenderProgress({ current: renderedFeatures, total: totalFeatures });
                 }
               }
             });
          }
        
        // Complete progressive rendering
        if (onRenderComplete) onRenderComplete();
      }
    });
    
    // Helper function for road importance (for rendering priority)
    function getRoadImportance(tags: Record<string, string>): number {
      if (tags.highway === 'motorway' || tags.highway === 'motorway_link') return 10;
      if (tags.highway === 'trunk' || tags.highway === 'trunk_link') return 9;
      if (tags.highway === 'primary' || tags.highway === 'primary_link') return 8;
      if (tags.highway === 'secondary' || tags.highway === 'secondary_link') return 7;
      if (tags.highway === 'tertiary' || tags.highway === 'tertiary_link') return 6;
      if (tags.highway === 'residential' || tags.highway === 'unclassified') return 5;
      if (tags.highway === 'service') return 4;
      if (tags.highway === 'footway' || tags.highway === 'cycleway' || tags.highway === 'path') return 3;
      if (tags.highway === 'track') return 2;
      return 1;
    }
    
    // Add canvas layer to map
    const canvasLayer = new CanvasLayer();
    canvasLayer.addTo(map);
    
    // Cleanup function
    return () => {
      if (map.hasLayer(canvasLayer)) {
        map.removeLayer(canvasLayer);
      }
    };
    };
    
    initializeMap();
  }, [osmData, map, getLandUseColor, getBuildingColor, getRoadColor, getRoadWidth, onRenderProgress, onRenderStart, onRenderComplete]);
  
  return null; // This component doesn't render anything directly
} 