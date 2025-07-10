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

interface OsmData {
  bounds?: OsmBounds;
  nodes: OsmNode[];
  ways: OsmWay[];
}

export function OsmMapViewer({ osmMapPath, cityName, cityId }: OsmMapViewerProps) {
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

        // Extract city ID from the osmMapPath
        // const pathParts = osmMapPath.split('/');
        // const cityId = pathParts[pathParts.length - 2]; // Assuming path is /api/cities/{id}/osm-data
        
        // if (!cityId || isNaN(parseInt(cityId))) {
        //   throw new Error('Invalid city ID in OSM map path');
        // }
        
        // Fetch processed OSM data from our caching API
        const response = await fetch(`/api/cities/${cityId}/osm-data`);
        if (!response.ok) {
          throw new Error(`Failed to fetch OSM data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load OSM data');
        }
        
        const { data, bounds, cached } = result;
        
        // Create node map for quick lookup
        const nodeMapData = new Map<string, OsmNode>();
        data.nodes.forEach((node: OsmNode) => nodeMapData.set(node.id, node));
        setNodeMap(nodeMapData);

        // Set bounds if available
        if (bounds) {
          data.bounds = bounds;
        } else if (data.nodes.length > 0) {
          // Calculate bounds from nodes if not provided
          const lats = data.nodes.map((n: OsmNode) => n.lat);
          const lons = data.nodes.map((n: OsmNode) => n.lon);
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
          // Use first valid node as center if no bounds
          const firstNode = data.nodes.find((n: OsmNode) => !isNaN(n.lat) && !isNaN(n.lon) && isFinite(n.lat) && isFinite(n.lon));
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

        console.log(`OSM data loaded${cached ? ' from cache' : ' and cached'}:`, {
          nodes: data.nodes.length,
          ways: data.ways.length,
          cached
        });

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
  getRoadWidth
}: {
  osmData: OsmData;
  getLandUseColor: (tags: Record<string, string>) => string;
  getBuildingColor: (tags: Record<string, string>) => string;
  getRoadColor: (tags: Record<string, string>) => string;
  getRoadWidth: (tags: Record<string, string>) => number;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!osmData || typeof window === 'undefined') return;
    
    const L = require('leaflet');
    
    // Create optimized data structures  
    const nodeMap = new Map<string, OsmNode>();
    
    // Build node map for O(1) lookups
    osmData.nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });
    
         // Pre-process ways with positions for efficient rendering
     const processedWays = osmData.ways.map(way => {
       const wayNodes = way.nodes
         .map(nodeId => nodeMap.get(nodeId))
         .filter(node => node !== undefined) as OsmNode[];
       
       if (wayNodes.length === 0) return null;
       
       const processedWay = {
         ...way,
         nodes: wayNodes,
         positions: wayNodes.map(node => [node.lat, node.lon] as [number, number])
       };
       
       return processedWay;
     }).filter(way => way !== null);
    
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
         
         // Clear rendered elements for click detection
         this._renderedElements = [];
         
         // Use all processed ways (no viewport culling)
         const waysToRender = processedWays;
         
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
        
                 // Optimized drawing functions with batching
         const drawBatchedPolygons = (ways: any[], getColor: (tags: any) => string, strokeColor?: string, elementType: string = 'polygon') => {
           const colorGroups = new Map<string, any[]>();
           
           // Group by color for batching
           ways.forEach(way => {
             const color = getColor(way.tags || {});
             if (!colorGroups.has(color)) {
               colorGroups.set(color, []);
             }
             colorGroups.get(color)!.push(way);
           });
           
           // Render each color group in batch
           colorGroups.forEach((group, color) => {
             ctx.fillStyle = color;
             if (strokeColor) {
               ctx.strokeStyle = strokeColor;
               ctx.lineWidth = 1;
             }
             
             group.forEach(way => {
               if (way.positions.length < 3) return;
               
               const canvasPoints = way.positions.map((pos: [number, number]) => {
                 const point = latLngToCanvasPoint(pos[0], pos[1]);
                 return { x: point.x, y: point.y };
               });
               
               // Scale for click detection
               const scaledPoints = canvasPoints.map((point: {x: number, y: number}) => ({
                 x: point.x * (window.devicePixelRatio || 1),
                 y: point.y * (window.devicePixelRatio || 1)
               }));
               
               ctx.beginPath();
               canvasPoints.forEach((point: {x: number, y: number}, index: number) => {
                 if (index === 0) {
                   ctx.moveTo(point.x, point.y);
                 } else {
                   ctx.lineTo(point.x, point.y);
                 }
               });
               ctx.closePath();
               ctx.fill();
               if (strokeColor) ctx.stroke();
               
               // Store for click detection with scaled coordinates
               this._renderedElements.push({
                 type: elementType,
                 points: scaledPoints,
                 tags: way.tags || {},
                 way: way
               });
             });
           });
         };
        
                 const drawBatchedLines = (ways: any[], getColor: (tags: any) => string, getWidth: (tags: any) => number, elementType: string = 'line') => {
           const styleGroups = new Map<string, any[]>();
           
           // Group by style for batching
           ways.forEach(way => {
             const color = getColor(way.tags || {});
             const width = getWidth(way.tags || {});
             const styleKey = `${color}-${width}`;
             if (!styleGroups.has(styleKey)) {
               styleGroups.set(styleKey, []);
             }
             styleGroups.get(styleKey)!.push(way);
           });
           
           // Render each style group in batch
           styleGroups.forEach((group, styleKey) => {
             const [color, width] = styleKey.split('-');
             ctx.strokeStyle = color;
             ctx.lineWidth = parseInt(width);
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             
             group.forEach(way => {
               if (way.positions.length < 2) return;
               
               const canvasPoints = way.positions.map((pos: [number, number]) => {
                 const point = latLngToCanvasPoint(pos[0], pos[1]);
                 return { x: point.x, y: point.y };
               });
               
               // Scale for click detection
               const scaledPoints = canvasPoints.map((point: {x: number, y: number}) => ({
                 x: point.x * (window.devicePixelRatio || 1),
                 y: point.y * (window.devicePixelRatio || 1)
               }));
               
               ctx.beginPath();
               canvasPoints.forEach((point: {x: number, y: number}, index: number) => {
                 if (index === 0) {
                   ctx.moveTo(point.x, point.y);
                 } else {
                   ctx.lineTo(point.x, point.y);
                 }
               });
               ctx.stroke();
               
               // Store for click detection with scaled coordinates
               this._renderedElements.push({
                 type: elementType,
                 points: scaledPoints,
                 width: parseInt(width),
                 tags: way.tags || {},
                 way: way
               });
             });
           });
         };
        
                 // Filter visible ways by type for efficient rendering
         const visibleLandUse = waysToRender.filter(way => {
           const tags = way.tags || {};
           return tags.landuse || tags.leisure || tags.natural || tags.amenity === 'parking';
         });
         
         const visibleBuildings = waysToRender.filter(way => {
           const tags = way.tags || {};
           return tags.building;
         });
         
         const visibleWater = waysToRender.filter(way => {
           const tags = way.tags || {};
           return tags.waterway || tags.natural === 'water';
         });
         
         const visibleRoads = waysToRender.filter(way => {
           const tags = way.tags || {};
           return tags.highway;
         });
         
         const visibleRailways = waysToRender.filter(way => {
           const tags = way.tags || {};
           return tags.railway;
         });
         
         const visiblePower = waysToRender.filter(way => {
           const tags = way.tags || {};
           return tags.power === 'line' || tags.power === 'minor_line';
         });
        
                 // Render layers with LOD optimizations (always show core features)
         
         // Layer 1: Land Use Areas (always render for context)
         if (isLowDetail) {
           drawBatchedPolygons(visibleLandUse, getLandUseColor, undefined, 'landuse');
         }
         
         // Layer 2: Water Features (always render at medium+ detail)
         if (isMediumDetail) {
           drawBatchedLines(visibleWater, () => '#B5D0D0', (tags) => {
             return tags.waterway === 'river' ? 4 : tags.waterway === 'stream' ? 2 : 6;
           }, 'water');
         }
         
         // Layer 3: Buildings (scale complexity with zoom)
         if (isMediumDetail) {
           if (isHighDetail) {
             // Full building detail
             drawBatchedPolygons(visibleBuildings, getBuildingColor, '#666', 'building');
           } else {
             // Simplified buildings at medium zoom (more generous limit)
             drawBatchedPolygons(visibleBuildings.slice(0, 500), getBuildingColor, undefined, 'building');
           }
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
         
         // Layer 6: Roads (always render - most important layer)
         if (isLowDetail) {
           const sortedRoads = visibleRoads.sort((a, b) => {
             const aImportance = getRoadImportance(a.tags || {});
             const bImportance = getRoadImportance(b.tags || {});
             return bImportance - aImportance; // Render important roads first
           });
           
           // Limit roads at lower zoom levels but always show major ones
           const roadLimit = isHighDetail ? sortedRoads.length : isMediumDetail ? 1000 : 500;
           const roadsToRender = sortedRoads.slice(0, roadLimit);
           
           drawBatchedLines(roadsToRender, getRoadColor, getRoadWidth, 'road');
         }
        
                          // Layer 7: Points of Interest (show at medium+ detail)
         if (isMediumDetail) {
           const visibleNodes = osmData.nodes.filter(node => {
             const tags = node.tags || {};
             return tags.amenity || tags.shop || tags.leisure || tags.tourism || 
                    tags.historic || tags.natural || tags.place || tags.power || 
                    tags.highway === 'bus_stop' || tags.railway === 'station' ||
                    tags.railway === 'platform' || tags.public_transport === 'station' ||
                    tags.public_transport === 'platform' || tags.aeroway === 'aerodrome';
           });
          
          // Batch POI rendering by color
          const poiColorGroups = new Map<string, any[]>();
          visibleNodes.forEach(node => {
            const tags = node.tags || {};
            let color = '#6B7280';
            if (tags.amenity === 'hospital') color = '#EF4444';
            else if (tags.amenity === 'school' || tags.amenity === 'university') color = '#059669';
            else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') color = '#F59E0B';
            else if (tags.shop) color = '#F59E0B';
            else if (tags.tourism) color = '#10B981';
            else if (tags.highway === 'bus_stop' || tags.railway === 'station') color = '#4F46E5';
            
            if (!poiColorGroups.has(color)) {
              poiColorGroups.set(color, []);
            }
            poiColorGroups.get(color)!.push(node);
          });
          
                     poiColorGroups.forEach((nodes, color) => {
             ctx.fillStyle = color;
             ctx.strokeStyle = '#FFFFFF';
             ctx.lineWidth = 2;
             
             nodes.forEach(node => {
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
             });
           });
        }
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
  }, [osmData, map, getLandUseColor, getBuildingColor, getRoadColor, getRoadWidth]);
  
  return null; // This component doesn't render anything directly
} 