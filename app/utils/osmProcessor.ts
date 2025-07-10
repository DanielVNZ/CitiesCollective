'use client';

export interface OsmBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface OsmNode {
  id: string;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OsmWay {
  id: string;
  nodes: string[];
  tags?: Record<string, string>;
}

export interface OsmRelation {
  id: string;
  members: Array<{
    type: 'way' | 'node' | 'relation';
    ref: string;
    role: string;
  }>;
  tags?: Record<string, string>;
}

export interface OsmData {
  bounds?: OsmBounds;
  nodes: OsmNode[];
  ways: OsmWay[];
  relations?: OsmRelation[];
}

export interface ProcessingProgress {
  stage: 'downloading' | 'parsing' | 'processing_nodes' | 'processing_ways' | 'processing_relations' | 'complete';
  current: number;
  total: number;
  message: string;
}

// Constants for limits (same as server)
const MAX_NODES = 1500000; // Reduced for client-side processing
const MAX_WAYS = 1000000;
const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB limit

export class ClientOsmProcessor {
  private worker: Worker | null = null;
  private abortController: AbortController | null = null;
  private useWorker: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Use main thread processing to avoid Web Worker DOMParser issues
      this.useWorker = false;
      
      // Keeping Web Worker code for future use
      try {
        this.initializeWorker();
      } catch (error) {
        // Silently fail Web Worker initialization
      }
    }
  }

  private initializeWorker() {
    // Create Web Worker for OSM processing
    const workerCode = `
      self.onmessage = function(e) {
        const { osmText, maxNodes, maxWays } = e.data;
        
        try {
          // Check if DOMParser is available
          if (typeof DOMParser === 'undefined') {
            throw new Error('DOMParser is not available in this environment');
          }
          
          // Parse XML using DOMParser
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(osmText, 'text/xml');
          
          // Check for parsing errors
          const parserError = xmlDoc.querySelector('parsererror');
          if (parserError) {
            throw new Error('XML parsing error: ' + parserError.textContent);
          }
          
          if (!xmlDoc.documentElement || xmlDoc.documentElement.nodeName !== 'osm') {
            throw new Error('Invalid OSM file format');
          }
          
          // Progress tracking
          let progress = 0;
          
          // Extract bounds
          let bounds = undefined;
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
          
          // Get elements
          const nodeElements = Array.from(xmlDoc.documentElement.getElementsByTagName('node'));
          const wayElements = Array.from(xmlDoc.documentElement.getElementsByTagName('way'));
          const relationElements = Array.from(xmlDoc.documentElement.getElementsByTagName('relation'));
          
          const totalElements = nodeElements.length + wayElements.length + relationElements.length;
          
          // Process nodes
          const nodes = [];
          const nodeMap = new Map();
          
          self.postMessage({
            type: 'progress',
            stage: 'processing_nodes',
            current: 0,
            total: Math.min(nodeElements.length, maxNodes),
            message: 'Processing nodes...'
          });
          
          const nodesToProcess = Math.min(nodeElements.length, maxNodes);
          for (let i = 0; i < nodesToProcess; i++) {
            const nodeElement = nodeElements[i];
            const id = nodeElement.getAttribute('id') || '';
            const lat = parseFloat(nodeElement.getAttribute('lat') || '0');
            const lon = parseFloat(nodeElement.getAttribute('lon') || '0');
            
            // Skip invalid coordinates
            if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
              continue;
            }
            
            const node = { id, lat, lon };
            
            // Parse tags
            const tagElements = nodeElement.getElementsByTagName('tag');
            if (tagElements.length > 0) {
              node.tags = {};
              for (let j = 0; j < tagElements.length; j++) {
                const tagElement = tagElements[j];
                const key = tagElement.getAttribute('k') || '';
                const value = tagElement.getAttribute('v') || '';
                if (key && value) {
                  node.tags[key] = value;
                }
              }
            }
            
            nodes.push(node);
            nodeMap.set(id, node);
            
            // Report progress every 1000 nodes
            if (i % 1000 === 0) {
              self.postMessage({
                type: 'progress',
                stage: 'processing_nodes',
                current: i,
                total: nodesToProcess,
                message: \`Processing nodes: \${i}/\${nodesToProcess}\`
              });
            }
          }
          
          // Process ways
          const ways = [];
          
          self.postMessage({
            type: 'progress',
            stage: 'processing_ways',
            current: 0,
            total: Math.min(wayElements.length, maxWays),
            message: 'Processing ways...'
          });
          
          const waysToProcess = Math.min(wayElements.length, maxWays);
          for (let i = 0; i < waysToProcess; i++) {
            const wayElement = wayElements[i];
            const id = wayElement.getAttribute('id') || '';
            const way = { id, nodes: [] };
            
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
                  way.tags[key] = value;
                }
              }
            }
            
            ways.push(way);
            
            // Report progress every 500 ways
            if (i % 500 === 0) {
              self.postMessage({
                type: 'progress',
                stage: 'processing_ways',
                current: i,
                total: waysToProcess,
                message: \`Processing ways: \${i}/\${waysToProcess}\`
              });
            }
          }
          
          // Process relations
          const relations = [];
          
          self.postMessage({
            type: 'progress',
            stage: 'processing_relations',
            current: 0,
            total: relationElements.length,
            message: 'Processing relations...'
          });
          
          for (let i = 0; i < relationElements.length; i++) {
            const relationElement = relationElements[i];
            const id = relationElement.getAttribute('id') || '';
            const relation = { id, members: [] };
            
            // Get members
            const memberElements = relationElement.getElementsByTagName('member');
            for (let j = 0; j < memberElements.length; j++) {
              const memberElement = memberElements[j];
              const type = memberElement.getAttribute('type');
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
                  relation.tags[key] = value;
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
            
            // Report progress every 100 relations
            if (i % 100 === 0) {
              self.postMessage({
                type: 'progress',
                stage: 'processing_relations',
                current: i,
                total: relationElements.length,
                message: \`Processing relations: \${i}/\${relationElements.length}\`
              });
            }
          }
          
          // Send final result
          self.postMessage({
            type: 'complete',
            data: {
              bounds,
              nodes,
              ways,
              relations
            },
            stats: {
              totalNodesInFile: nodeElements.length,
              totalWaysInFile: wayElements.length,
              totalRelationsInFile: relationElements.length,
              processedNodes: nodes.length,
              processedWays: ways.length,
              processedRelations: relations.length,
              limited: nodeElements.length > maxNodes || wayElements.length > maxWays
            }
          });
          
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error.message
          });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  async processOsmFromUrl(
    osmUrl: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{ data: OsmData; stats: any }> {
    this.abortController = new AbortController();
    
    try {
      // Download OSM file
      onProgress?.({
        stage: 'downloading',
        current: 0,
        total: 100,
        message: 'Downloading OSM file...'
      });

      const response = await fetch(osmUrl, {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to download OSM file: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error(`OSM file too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      }

      const osmText = await response.text();

      if (osmText.length > MAX_FILE_SIZE) {
        throw new Error(`OSM file too large (${Math.round(osmText.length / 1024 / 1024)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      }

      onProgress?.({
        stage: 'parsing',
        current: 100,
        total: 100,
        message: 'Parsing OSM data...'
      });

      // Use Web Worker if available, otherwise process on main thread
      if (this.useWorker && this.worker) {
        return this.processWithWorker(osmText, onProgress);
      } else {
        return this.processOnMainThread(osmText, onProgress);
      }

    } catch (error) {
      throw error;
    }
  }

  private async processWithWorker(
    osmText: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{ data: OsmData; stats: any }> {
    return new Promise((resolve, reject) => {
      // Set up worker message handler
      this.worker!.onmessage = (e) => {
        const { type, data, stats, error, ...progressData } = e.data;
        
        if (type === 'progress') {
          onProgress?.(progressData as ProcessingProgress);
        } else if (type === 'complete') {
          resolve({ data, stats });
        } else if (type === 'error') {
          reject(new Error(error));
        }
      };

      // Send data to worker
      this.worker!.postMessage({
        osmText,
        maxNodes: MAX_NODES,
        maxWays: MAX_WAYS
      });
    });
  }

  private async processOnMainThread(
    osmText: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{ data: OsmData; stats: any }> {
    // Check if DOMParser is available
    if (typeof DOMParser === 'undefined') {
      throw new Error('DOMParser is not available in this browser environment');
    }
    
    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(osmText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }
    
    if (!xmlDoc.documentElement || xmlDoc.documentElement.nodeName !== 'osm') {
      throw new Error('Invalid OSM file format');
    }
    
    // Extract bounds
    let bounds: OsmBounds | undefined;
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
    
    // Get elements
    const nodeElements = Array.from(xmlDoc.documentElement.getElementsByTagName('node'));
    const wayElements = Array.from(xmlDoc.documentElement.getElementsByTagName('way'));
    const relationElements = Array.from(xmlDoc.documentElement.getElementsByTagName('relation'));
    
    // Process nodes with chunking to avoid blocking UI
    const nodes: OsmNode[] = [];
    const nodeMap = new Map<string, OsmNode>();
    
    onProgress?.({
      stage: 'processing_nodes',
      current: 0,
      total: Math.min(nodeElements.length, MAX_NODES),
      message: 'Processing nodes...'
    });
    
    const nodesToProcess = Math.min(nodeElements.length, MAX_NODES);
    await this.processInChunks(nodeElements, nodesToProcess, 1000, async (nodeElement, index) => {
      const id = nodeElement.getAttribute('id') || '';
      const lat = parseFloat(nodeElement.getAttribute('lat') || '0');
      const lon = parseFloat(nodeElement.getAttribute('lon') || '0');
      
      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
        return;
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
            node.tags[key] = value;
          }
        }
      }
      
      nodes.push(node);
      nodeMap.set(id, node);
      
      // Report progress
      if (index % 1000 === 0) {
        onProgress?.({
          stage: 'processing_nodes',
          current: index,
          total: nodesToProcess,
          message: `Processing nodes: ${index}/${nodesToProcess}`
        });
      }
    });
    
    // Process ways with chunking
    const ways: OsmWay[] = [];
    
    onProgress?.({
      stage: 'processing_ways',
      current: 0,
      total: Math.min(wayElements.length, MAX_WAYS),
      message: 'Processing ways...'
    });
    
    const waysToProcess = Math.min(wayElements.length, MAX_WAYS);
    await this.processInChunks(wayElements, waysToProcess, 500, async (wayElement, index) => {
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
        return;
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
            way.tags[key] = value;
          }
        }
      }
      
      ways.push(way);
      
      // Report progress
      if (index % 500 === 0) {
        onProgress?.({
          stage: 'processing_ways',
          current: index,
          total: waysToProcess,
          message: `Processing ways: ${index}/${waysToProcess}`
        });
      }
    });
    
    // Process relations with chunking
    const relations: OsmRelation[] = [];
    
    onProgress?.({
      stage: 'processing_relations',
      current: 0,
      total: relationElements.length,
      message: 'Processing relations...'
    });
    
    await this.processInChunks(relationElements, relationElements.length, 100, async (relationElement, index) => {
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
            relation.tags[key] = value;
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
      
      // Report progress
      if (index % 100 === 0) {
        onProgress?.({
          stage: 'processing_relations',
          current: index,
          total: relationElements.length,
          message: `Processing relations: ${index}/${relationElements.length}`
        });
      }
    });
    
    const data: OsmData = {
      bounds,
      nodes,
      ways,
      relations
    };
    
    const stats = {
      totalNodesInFile: nodeElements.length,
      totalWaysInFile: wayElements.length,
      totalRelationsInFile: relationElements.length,
      processedNodes: nodes.length,
      processedWays: ways.length,
      processedRelations: relations.length,
      limited: nodeElements.length > MAX_NODES || wayElements.length > MAX_WAYS
    };
    
    return { data, stats };
  }

  private async processInChunks<T>(
    elements: T[],
    totalToProcess: number,
    chunkSize: number,
    processor: (element: T, index: number) => Promise<void>
  ): Promise<void> {
    for (let i = 0; i < totalToProcess; i += chunkSize) {
      const end = Math.min(i + chunkSize, totalToProcess);
      
      // Process chunk
      for (let j = i; j < end; j++) {
        if (j < elements.length) {
          await processor(elements[j], j);
        }
      }
      
      // Yield control to prevent blocking UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.worker && this.useWorker) {
      this.worker.terminate();
      this.initializeWorker();
    }
  }

  destroy() {
    if (this.worker && this.useWorker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// Client-side caching using IndexedDB
export class OsmCache {
  private dbName = 'osmCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for cached OSM data
        if (!db.objectStoreNames.contains('osmData')) {
          const store = db.createObjectStore('osmData', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async get(key: string): Promise<{ data: OsmData; stats: any } | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['osmData'], 'readonly');
      const store = transaction.objectStore('osmData');
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (24 hours)
          const now = Date.now();
          const cacheAge = now - result.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (cacheAge < maxAge) {
            resolve({ data: result.data, stats: result.stats });
          } else {
            // Cache expired, remove it
            this.remove(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
    });
  }

  async set(key: string, data: OsmData, stats: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['osmData'], 'readwrite');
      const store = transaction.objectStore('osmData');
      const request = store.put({
        key,
        data,
        stats,
        timestamp: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['osmData'], 'readwrite');
      const store = transaction.objectStore('osmData');
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['osmData'], 'readwrite');
      const store = transaction.objectStore('osmData');
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
} 