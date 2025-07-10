'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';
import { ClientOsmProcessor, OsmCache, ProcessingProgress, OsmData, OsmNode, OsmWay, OsmRelation, OsmBounds } from '../utils/osmProcessor';

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

// Types are now imported from osmProcessor utility

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
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadOsmData = async () => {
      if (!osmMapPath) return;
      
      try {
        setIsLoading(true);
        setIsProcessing(true);
        setError(null);
        setRenderProgress(null);
        setProcessingProgress(null);

        // Initialize client-side cache
        const cache = new OsmCache();
        const cacheKey = `osm-${cityId}-${osmMapPath}`;
        
        // Check cache first
        const cachedData = await cache.get(cacheKey);
        if (cachedData) {
          setOsmData(cachedData.data);
          
          // Show warning if data was limited
          if (cachedData.stats.limited) {
            console.warn(`OSM data was limited: ${cachedData.stats.processedNodes}/${cachedData.stats.totalNodesInFile} nodes, ${cachedData.stats.processedWays}/${cachedData.stats.totalWaysInFile} ways processed`);
            setDataLimited(true);
            setDataStats({
              processed: cachedData.stats.processedNodes,
              total: cachedData.stats.totalNodesInFile,
              type: 'nodes'
            });
          } else {
            setDataLimited(false);
            setDataStats(null);
          }
          
          // Process cached data
          processCachedData(cachedData.data);
          setIsProcessing(false);
          return;
        }

        // Process OSM data client-side
        const processor = new ClientOsmProcessor();
        
        const result = await processor.processOsmFromUrl(osmMapPath, (progress) => {
          setProcessingProgress(progress);
        });
        
        const { data, stats } = result;
        
        // Cache the processed data
        await cache.set(cacheKey, data, stats);
        
        // Show warning if data was limited
        if (stats.limited) {
          console.warn(`OSM data was limited: ${stats.processedNodes}/${stats.totalNodesInFile} nodes, ${stats.processedWays}/${stats.totalWaysInFile} ways processed`);
          setDataLimited(true);
          setDataStats({
            processed: stats.processedNodes,
            total: stats.totalNodesInFile,
            type: 'nodes'
          });
        } else {
          setDataLimited(false);
          setDataStats(null);
        }
        
        processCachedData(data);
        setOsmData(data);
        
        // Clean up
        processor.destroy();

      } catch (err) {
        console.error('OSM data loading error:', err);
        let errorMessage = 'Failed to load OSM data';
        
        if (err instanceof Error) {
          errorMessage = err.message;
          
          // Provide more helpful error messages for common issues
          if (err.message.includes('DOMParser')) {
            errorMessage = 'Browser compatibility issue with XML parsing. Please try refreshing the page or using a different browser.';
          } else if (err.message.includes('fetch')) {
            errorMessage = 'Failed to download OSM file. Please check your internet connection.';
          } else if (err.message.includes('too large')) {
            errorMessage = err.message; // Keep the detailed size message
          }
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
        setProcessingProgress(null);
      }
    };

    const processCachedData = (data: OsmData) => {
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
      if (data.bounds) {
        // Calculate map center and zoom for custom map
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
    };

    loadOsmData();
  }, [osmMapPath, cityId]);







  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isProcessing ? 'Processing map data...' : 'Loading map data...'}
          </p>
          {processingProgress && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {processingProgress.message}
            </p>
          )}
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
    // Comprehensive land use colors following OSM standards
    
    // Water features
    if (tags.natural === 'water' || tags.waterway === 'riverbank' || 
        tags.landuse === 'reservoir' || tags.landuse === 'basin' || 
        tags.place === 'sea' || tags.place === 'ocean' ||
        tags.natural === 'bay' || tags.natural === 'strait') {
      return '#2E86AB'; // Darker blue
    }
    
    // Forest and woods
    if (tags.landuse === 'forest' || tags.natural === 'wood') return '#8DC56C';
    
    // Beach and sand
    if (tags.natural === 'beach' || tags.natural === 'sand') return '#FEFEC0';
    
    // Farm areas
    if (tags.landuse === 'farm' || tags.landuse === 'farmland') return '#E9D8BD';
    if (tags.landuse === 'farmyard') return '#DCBE91';
    
    // Academic areas  
    if (tags.amenity === 'university' || tags.amenity === 'college' || tags.amenity === 'school') return '#F0F0D8';
    
    // Residential - medium green
    if (tags.landuse === 'residential') return '#66BB6A';
    
    // Grass and parks
    if (tags.landuse === 'grass' || tags.leisure === 'park' || 
        tags.natural === 'meadow' || tags.landuse === 'meadow') return '#CFECA8';
    
    // Nature reserve
    if (tags.leisure === 'nature_reserve') return '#ABDE96';
    
    // Car park
    if (tags.amenity === 'parking') return '#F6EEB7';
    
    // Parks and leisure
    if (tags.leisure === 'garden') return '#CFECA8';
    if (tags.leisure === 'pitch') return '#89D2AE';
    if (tags.leisure === 'stadium') return '#33CC99';
    if (tags.leisure === 'track') return '#74DCBA';
    if (tags.leisure === 'playground') return '#CCFEF0';
    
    // Village green
    if (tags.landuse === 'village_green') return '#CFECA8';
    
    // Commercial and retail
    if (tags.landuse === 'retail' || tags.shop === 'yes') return '#F0D9D9';
    if (tags.landuse === 'industrial') return '#FFFFE0'; // Light yellow
    if (tags.office) return '#9932CC'; // Purple
    if (tags.landuse === 'commercial') return '#87CEEB'; // Sky Blue
    
    // Graveyard
    if (tags.amenity === 'grave_yard' || tags.landuse === 'cemetery') return '#A9CAAE';
    
    // Military
    if (tags.landuse === 'military' || tags.military === 'barracks') return '#FE9898';
    
    // Aeroway
    if (tags.aeroway === 'apron' || tags.aeroway === 'terminal') return '#E9D1FE';
    
    // Orchard
    if (tags.landuse === 'orchard') return '#9fd790';
    
    // Quarry
    if (tags.landuse === 'quarry') return 'white';
    
    // Landfill
    if (tags.landuse === 'landfill') return '#D3D3D3';
    
    // Glacier
    if (tags.natural === 'glacier') return '#DDECEC';
    
    // Fell areas (high moorland/mountain terrain)
    if (tags.natural === 'fell') return '#C5FF5B';
    
    // Pedestrian areas
    if (tags.highway === 'pedestrian') return '#EDEDED';
    
    // Power substation
    if (tags.power === 'substation') return '#DFD1D6';
    
    // Default land color
    return '#F1EEE8';
  };

  const getBuildingColor = (tags: Record<string, string>) => {
    // Special amenity buildings get their own colors
    if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') return '#F0F0D8';
    if (tags.amenity === 'hospital') return '#FFE5E5';
    if (tags.amenity === 'fire_station') return '#FF9999';
    if (tags.amenity === 'police') return '#9999FF';
    if (tags.amenity === 'bank') return '#E0E7FF';
    if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') return '#FEF3C7';
    
    // Commercial buildings
    if (tags.shop || tags.office || tags.building === 'commercial' || tags.building === 'retail') return '#DBEAFE';
    
    // Industrial buildings
    if (tags.building === 'industrial' || tags.building === 'warehouse' || tags.building === 'factory') return '#FEF3C7';
    
    // Residential buildings - medium green
    if (tags.building === 'residential' || tags.building === 'house' || tags.building === 'apartments') return '#4CAF50';
    
    // Default building color
    return '#BCA9A9';
  };

  const getRoadColor = (tags: Record<string, string>) => {
    // Road colors based on hierarchy
    if (tags.highway === 'motorway' || tags.highway === 'motorway_link') return '#849BBD';
    if (tags.highway === 'trunk' || tags.highway === 'trunk_link') return '#96D296';
    if (tags.highway === 'primary' || tags.highway === 'primary_link') return '#ECA2A3';
    if (tags.highway === 'secondary' || tags.highway === 'secondary_link') return '#FDD6A4';
    if (tags.highway === 'tertiary' || tags.highway === 'tertiary_link') return '#FEFEB2';
    if (tags.highway === 'residential' || tags.highway === 'unclassified') return '#CCCCCC';
    if (tags.highway === 'service') return '#CCCCCC';
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
      
      {/* Client-side processing indicator */}
      {isProcessing && processingProgress && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {processingProgress.message}
                </p>
                <span className="text-sm text-green-600 dark:text-green-300">
                  {processingProgress.current} / {processingProgress.total}
                </span>
              </div>
              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                ></div>
              </div>
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
    const processMultipolygonRelations = (relations: OsmRelation[], ways: any[], wayMap: Map<string, any>) => {
      const processedMultipolygons: any[] = [];
      
      for (const relation of relations) {
        if (relation.tags?.type === 'multipolygon' && relation.tags) {
          // Get outer and inner ways
          const outerWays: any[] = [];
          const innerWays: any[] = [];
          
          for (const member of relation.members) {
            if (member.type === 'way') {
              const way = wayMap.get(member.ref);
              if (way && way.positions && way.positions.length > 2) {
                if (member.role === 'outer') {
                  outerWays.push(way);
                } else if (member.role === 'inner') {
                  innerWays.push(way);
                }
              }
            }
          }
          
          // Create multipolygon objects with outer and inner rings
          if (outerWays.length > 0) {
            // Try to merge outer ways into continuous rings
            const outerRings = mergeWaysIntoRings(outerWays);
            const innerRings = mergeWaysIntoRings(innerWays);
            
            for (const outerRing of outerRings) {
              const multipolygon = {
                id: `multipolygon_${relation.id}_${outerRing.id}`,
                positions: outerRing.positions,
                holes: innerRings.map(ring => ring.positions),
                tags: { ...relation.tags }, // Use relation tags
                isMultipolygon: true,
                relationId: relation.id
              };
              processedMultipolygons.push(multipolygon);
            }
          }
        }
      }
      
      return processedMultipolygons;
    };
    
    // Helper function to merge ways into continuous rings
    const mergeWaysIntoRings = (ways: any[]): any[] => {
      if (ways.length === 0) return [];
      
      const rings: any[] = [];
      const unprocessedWays = [...ways];
      
      while (unprocessedWays.length > 0) {
        const ring = unprocessedWays.shift()!;
        let ringPositions = [...ring.positions];
        
        // Try to connect other ways to form a closed ring
        let foundConnection = true;
        while (foundConnection && unprocessedWays.length > 0) {
          foundConnection = false;
          
          for (let i = 0; i < unprocessedWays.length; i++) {
            const way = unprocessedWays[i];
            const wayPositions = way.positions;
            
            // Check if way connects to end of ring
            if (isPointsEqual(ringPositions[ringPositions.length - 1], wayPositions[0])) {
              // Connect to end
              ringPositions = [...ringPositions, ...wayPositions.slice(1)];
              unprocessedWays.splice(i, 1);
              foundConnection = true;
              break;
            } else if (isPointsEqual(ringPositions[ringPositions.length - 1], wayPositions[wayPositions.length - 1])) {
              // Connect to end (reversed)
              ringPositions = [...ringPositions, ...wayPositions.slice(0, -1).reverse()];
              unprocessedWays.splice(i, 1);
              foundConnection = true;
              break;
            } else if (isPointsEqual(ringPositions[0], wayPositions[wayPositions.length - 1])) {
              // Connect to start
              ringPositions = [...wayPositions, ...ringPositions.slice(1)];
              unprocessedWays.splice(i, 1);
              foundConnection = true;
              break;
            } else if (isPointsEqual(ringPositions[0], wayPositions[0])) {
              // Connect to start (reversed)
              ringPositions = [...wayPositions.reverse(), ...ringPositions.slice(1)];
              unprocessedWays.splice(i, 1);
              foundConnection = true;
              break;
            }
          }
        }
        
        rings.push({
          id: ring.id,
          positions: ringPositions
        });
      }
      
      return rings;
    };
    
    // Helper function to check if two points are equal (with tolerance)
    const isPointsEqual = (p1: [number, number], p2: [number, number]): boolean => {
      const tolerance = 0.000001;
      return Math.abs(p1[0] - p2[0]) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance;
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
         
         // Add sea background color (following OSMExport.mrules map-sea-color exactly)
         ctx.fillStyle = '#F1EEE8'; // Light beige background for sea/ocean areas (from OSMExport.mrules)
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
         let multipolygons: any[] = [];
         if (osmData.relations && osmData.relations.length > 0) {
           multipolygons = processMultipolygonRelations(osmData.relations, waysToRender, wayMap);
         }
         
         // Combine regular ways with multipolygons
         const allWaysToRender = [...waysToRender, ...multipolygons];
         
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
        
                 // Filter visible ways by type for efficient rendering
         const visibleLandUse: any[] = [];
         const visibleBuildings: any[] = [];
         const visibleWater: any[] = [];
         const visibleWaterways: any[] = [];
         const visibleRoads: any[] = [];
         const visibleRailways: any[] = [];
         const visiblePower: any[] = [];
         const visibleContours: any[] = [];
         
         // Categorize ways for comprehensive rendering
         for (let i = 0; i < allWaysToRender.length; i++) {
           const way = allWaysToRender[i];
           const tags = way.tags || {};
           
           // Skip multipolygons as they're handled separately
           if (way.isMultipolygon) continue;
           
           // Contour lines - check multiple tagging schemes
           if ((tags.contour === 'elevation' && tags.ele) || 
               (tags.natural === 'contour' && tags.ele) ||
               tags.contour === 'contour' ||
               tags['contour:type'] === 'elevation') {
             visibleContours.push(way);
           }
           
           // Water features - both areas and lines
           if (tags.natural === 'water' || tags.waterway === 'riverbank' || 
               tags.landuse === 'reservoir' || tags.landuse === 'basin' || 
               tags.waterway === 'dock' || tags.place === 'sea' || 
               tags.place === 'ocean' || tags.natural === 'bay' ||
               tags.natural === 'strait' || tags.leisure === 'marina') {
             visibleWater.push(way);
           }
           
           // Waterways (rivers, streams, etc.)
           if (tags.waterway === 'river' || tags.waterway === 'stream' || 
               tags.waterway === 'canal' || tags.waterway === 'drain' || 
               tags.natural === 'coastline') {
             visibleWaterways.push(way);
           }
           
           // Land use features
           if (tags.landuse === 'forest' || tags.natural === 'wood' ||
               tags.natural === 'beach' || tags.natural === 'sand' ||
               tags.landuse === 'grass' || tags.leisure === 'park' ||
               tags.natural === 'meadow' || tags.landuse === 'meadow' ||
               tags.landuse === 'residential' || tags.landuse === 'commercial' ||
               tags.landuse === 'industrial' || tags.landuse === 'farm' ||
               tags.landuse === 'farmland' || tags.landuse === 'farmyard' ||
               tags.amenity === 'university' || tags.amenity === 'college' ||
               tags.amenity === 'school' || tags.leisure === 'nature_reserve' ||
               tags.amenity === 'parking' || tags.leisure === 'garden' ||
               tags.leisure === 'pitch' || tags.leisure === 'stadium' ||
               tags.leisure === 'track' || tags.leisure === 'playground' ||
               tags.landuse === 'village_green' || tags.landuse === 'retail' ||
               tags.shop === 'yes' || tags.office || tags.amenity === 'grave_yard' ||
               tags.landuse === 'cemetery' || tags.landuse === 'military' ||
               tags.military === 'barracks' || tags.aeroway === 'apron' ||
               tags.aeroway === 'terminal' || tags.landuse === 'orchard' ||
               tags.landuse === 'quarry' || tags.landuse === 'landfill' ||
               tags.natural === 'glacier' || tags.natural === 'fell' ||
               tags.highway === 'pedestrian' || tags.power === 'substation') {
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

         // New function to draw multipolygons with holes using canvas clipping
         const drawMultipolygonsWithHoles = (multipolygons: any[], getColor: (tags: any) => string) => {
           for (const multipolygon of multipolygons) {
             const color = getColor(multipolygon.tags || {});
             if (color === 'transparent') continue;
             
             // Convert outer ring to canvas coordinates
             const outerCanvasPoints = multipolygon.positions.map((pos: [number, number]) => {
               const point = latLngToCanvasPoint(pos[0], pos[1]);
               return { x: point.x, y: point.y };
             });
             
             // Convert holes to canvas coordinates
             const holeCanvasPoints = multipolygon.holes.map((hole: [number, number][]) => {
               return hole.map((pos: [number, number]) => {
                 const point = latLngToCanvasPoint(pos[0], pos[1]);
                 return { x: point.x, y: point.y };
               });
             });
             
             // Use canvas clipping to create holes
             ctx.save();
             
             // Create clipping path for outer ring
             ctx.beginPath();
             outerCanvasPoints.forEach((point: {x: number, y: number}, index: number) => {
               if (index === 0) {
                 ctx.moveTo(point.x, point.y);
               } else {
                 ctx.lineTo(point.x, point.y);
               }
             });
             ctx.closePath();
             
             // Add holes as counter-clockwise paths to subtract from outer ring
             for (const hole of holeCanvasPoints) {
               if (hole.length < 3) continue;
               
               // Add hole path (counter-clockwise to create hole)
               ctx.moveTo(hole[0].x, hole[0].y);
               for (let i = hole.length - 1; i > 0; i--) {
                 ctx.lineTo(hole[i].x, hole[i].y);
               }
               ctx.closePath();
             }
             
             // Set fill rule to handle holes properly
             ctx.fillStyle = color;
             ctx.fill('evenodd'); // Use even-odd fill rule to handle holes
             
             ctx.restore();
             
             // Store for click detection
             const scaledOuterPoints = outerCanvasPoints.map((point: {x: number, y: number}) => ({
               x: point.x * (window.devicePixelRatio || 1),
               y: point.y * (window.devicePixelRatio || 1)
             }));
             
             this._renderedElements.push({
               type: 'multipolygon',
               points: scaledOuterPoints,
               holes: holeCanvasPoints.map((hole: {x: number, y: number}[]) => 
                 hole.map((point: {x: number, y: number}) => ({
                   x: point.x * (window.devicePixelRatio || 1),
                   y: point.y * (window.devicePixelRatio || 1)
                 }))
               ),
               tags: multipolygon.tags || {},
               way: multipolygon
             });
             
             // Update progress
             renderedFeatures++;
             if (onRenderProgress && totalFeatures > 0) {
               onRenderProgress({ current: renderedFeatures, total: totalFeatures });
             }
           }
         };
         
         // Simplified waterway rendering
         const drawWaterways = (waterways: any[]) => {
           for (const way of waterways) {
             const tags = way.tags || {};
             
             // Convert to canvas coordinates
             const canvasPoints = way.positions.map((pos: [number, number]) => {
               const point = latLngToCanvasPoint(pos[0], pos[1]);
               return { x: point.x, y: point.y };
             });
             
             // Set color and width based on waterway type
             if (tags.waterway === 'river') {
               ctx.strokeStyle = '#2E86AB';
               ctx.lineWidth = 5;
             } else if (tags.waterway === 'stream') {
               ctx.strokeStyle = '#2E86AB';
               ctx.lineWidth = 2;
             } else if (tags.waterway === 'canal') {
               ctx.strokeStyle = '#2E86AB';
               ctx.lineWidth = 4;
             } else if (tags.waterway === 'drain') {
               ctx.strokeStyle = '#2E86AB';
               ctx.lineWidth = 1;
             } else if (tags.natural === 'coastline') {
               ctx.strokeStyle = '#2E86AB';
               ctx.lineWidth = 2;
             } else {
               ctx.strokeStyle = '#2E86AB';
               ctx.lineWidth = 2;
             }
             
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             
             ctx.beginPath();
             canvasPoints.forEach((point: {x: number, y: number}, index: number) => {
               if (index === 0) {
                 ctx.moveTo(point.x, point.y);
               } else {
                 ctx.lineTo(point.x, point.y);
               }
             });
             ctx.stroke();
             
             // Store for click detection
             const scaledPoints = canvasPoints.map((point: {x: number, y: number}) => ({
               x: point.x * (window.devicePixelRatio || 1),
               y: point.y * (window.devicePixelRatio || 1)
             }));
             
             this._renderedElements.push({
               type: 'waterway',
               points: scaledPoints,
               width: ctx.lineWidth,
               tags: way.tags || {},
               way: way
             });
             
             // Update progress
             renderedFeatures++;
             if (onRenderProgress && totalFeatures > 0) {
               onRenderProgress({ current: renderedFeatures, total: totalFeatures });
             }
           }
         };
         
         // Render contour lines
         const drawContours = (contours: any[]) => {
           for (const way of contours) {
             const tags = way.tags || {};
             const elevation = parseInt(tags.ele || '0');
             
             // Check if this is a major contour (every 100m)
             const isMajor = elevation % 100 === 0;
             
             // Convert to canvas coordinates
             const canvasPoints = way.positions.map((pos: [number, number]) => {
               const point = latLngToCanvasPoint(pos[0], pos[1]);
               return { x: point.x, y: point.y };
             });
             
             // Set contour line style
             ctx.strokeStyle = '#7f3300';
             ctx.globalAlpha = 0.35;
             ctx.lineWidth = isMajor ? 2 : 1;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             
             ctx.beginPath();
             canvasPoints.forEach((point: {x: number, y: number}, index: number) => {
               if (index === 0) {
                 ctx.moveTo(point.x, point.y);
               } else {
                 ctx.lineTo(point.x, point.y);
               }
             });
             ctx.stroke();
             
             // Reset alpha
             ctx.globalAlpha = 1;
             
             // Store for click detection
             const scaledPoints = canvasPoints.map((point: {x: number, y: number}) => ({
               x: point.x * (window.devicePixelRatio || 1),
               y: point.y * (window.devicePixelRatio || 1)
             }));
             
             this._renderedElements.push({
               type: 'contour',
               points: scaledPoints,
               width: ctx.lineWidth,
               tags: way.tags || {},
               way: way
             });
             
             // Update progress
             renderedFeatures++;
             if (onRenderProgress && totalFeatures > 0) {
               onRenderProgress({ current: renderedFeatures, total: totalFeatures });
             }
           }
         };
         
         // Render layers - comprehensive map rendering
         
         // Layer 1: Multipolygons with holes (render first for proper layering)
         if (multipolygons.length > 0) {
           drawMultipolygonsWithHoles(multipolygons, getLandUseColor);
         }
         
         // Layer 2: Land use areas (render before buildings for proper layering)
         if (isLowDetail) {
           drawBatchedPolygons(visibleLandUse, getLandUseColor, undefined, 'landuse');
         }
         
         // Layer 3: Water areas
         if (isLowDetail) {
           drawBatchedPolygons(visibleWater, () => '#2E86AB', undefined, 'water');
         }
         
         // Layer 4: Waterways (rivers, streams, etc.)
         drawWaterways(visibleWaterways);
         
         // Layer 5: Contour lines (render before buildings but after terrain)
         if (isMediumDetail && visibleContours.length > 0) {
           console.log(`Rendering ${visibleContours.length} contour lines`);
           drawContours(visibleContours);
         } else if (isMediumDetail) {
           console.log('No contour lines found in OSM data - contour lines are not typically included in standard OSM exports');
         }
         
         // Layer 6: Buildings (render after land use for proper layering)
         if (isMediumDetail) {
           drawBatchedPolygons(visibleBuildings, getBuildingColor, '#666', 'building');
         }
         
         // Layer 7: Railways (render before roads)
         if (isLowDetail) {
           for (const way of visibleRailways) {
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
             
             // Store for click detection
             this._renderedElements.push({
               type: 'railway',
               points: scaledPoints,
               width: width,
               tags: way.tags || {},
               way: way
             });
             
             // Update progress
             renderedFeatures++;
             if (onRenderProgress && totalFeatures > 0) {
               onRenderProgress({ current: renderedFeatures, total: totalFeatures });
             }
           }
         }
         
         // Layer 8: Power lines
         if (isMediumDetail) {
           drawBatchedLines(visiblePower, () => '#5c5c5c', (tags) => {
             return tags.power === 'line' ? 2 : 1;
           }, 'power');
         }
         
         // Layer 9: Roads (render last for visibility)
         if (isLowDetail) {
           // Sort roads by importance
           const sortedRoads = [...visibleRoads];
           sortedRoads.sort((a, b) => {
             const aImportance = getRoadImportance(a.tags || {});
             const bImportance = getRoadImportance(b.tags || {});
             return bImportance - aImportance; // Render important roads first
           });
           
           drawBatchedLines(sortedRoads, getRoadColor, getRoadWidth, 'road');
         }
         
         // Layer 10: Points of Interest (render on top)
         if (isMediumDetail) {
           const visibleNodes: any[] = [];
           // Find POI nodes including peaks
           for (let i = 0; i < osmData.nodes.length; i++) {
             const node = osmData.nodes[i];
             const tags = node.tags || {};
             if (tags.amenity || tags.shop || tags.leisure || tags.tourism || 
                 tags.historic || tags.natural || tags.place || tags.power || 
                 tags.highway === 'bus_stop' || tags.railway === 'station' ||
                 tags.railway === 'platform' || tags.public_transport === 'station' ||
                 tags.public_transport === 'platform' || tags.aeroway === 'aerodrome' ||
                 tags.natural === 'peak') {
               visibleNodes.push(node);
             }
           }
           
           // Batch POI rendering by color
           const poiColorGroups = new Map<string, any[]>();
           for (let i = 0; i < visibleNodes.length; i++) {
             const node = visibleNodes[i];
             const tags = node.tags || {};
             let color = '#6B7280';
             let shape = 'circle';
             
             if (tags.natural === 'peak') {
               color = '#D08F55';
               shape = 'triangle';
             } else if (tags.amenity === 'hospital') {
               color = '#EF4444';
             } else if (tags.amenity === 'school' || tags.amenity === 'university') {
               color = '#059669';
             } else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') {
               color = '#F59E0B';
             } else if (tags.shop) {
               color = '#F59E0B';
             } else if (tags.tourism) {
               color = '#10B981';
             } else if (tags.highway === 'bus_stop' || tags.railway === 'station') {
               color = '#4F46E5';
             }
             
             const groupKey = `${color}-${shape}`;
             if (!poiColorGroups.has(groupKey)) {
               poiColorGroups.set(groupKey, []);
             }
             poiColorGroups.get(groupKey)!.push(node);
           }
           
           // Render POI groups
           poiColorGroups.forEach((nodes, groupKey) => {
             const [color, shape] = groupKey.split('-');
             ctx.fillStyle = color;
             ctx.strokeStyle = '#FFFFFF';
             ctx.lineWidth = 2;
             
             for (let i = 0; i < nodes.length; i++) {
               const node = nodes[i];
               const point = latLngToCanvasPoint(node.lat, node.lon);
               
               ctx.beginPath();
               if (shape === 'triangle') {
                 // Draw triangle for peaks
                 const size = 6;
                 ctx.moveTo(point.x, point.y - size);
                 ctx.lineTo(point.x - size, point.y + size);
                 ctx.lineTo(point.x + size, point.y + size);
                 ctx.closePath();
               } else {
                 // Draw circle for other POIs
                 ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
               }
               ctx.fill();
               ctx.stroke();
               
               // Add elevation label for peaks
               if (node.tags?.natural === 'peak' && (node.tags?.ele || node.tags?.name)) {
                 ctx.fillStyle = '#ae4242';
                 ctx.font = '10px Verdana';
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'top';
                 
                 const label = node.tags.name 
                   ? (node.tags.ele ? `${node.tags.name}\n(${node.tags.ele}m)` : node.tags.name)
                   : `${node.tags.ele}m`;
                 
                 ctx.fillText(label, point.x, point.y + 8);
               }
               
               // Store for click detection
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