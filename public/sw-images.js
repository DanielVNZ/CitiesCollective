// Mobile-optimized image caching service worker
const CACHE_NAME = 'images-cache-v2';
const STATIC_CACHE_NAME = 'static-cache-v2';
const API_CACHE_NAME = 'api-cache-v2';

// Mobile-specific cache sizes
const MAX_IMAGE_CACHE_SIZE = 50; // Reduced for mobile
const MAX_STATIC_CACHE_SIZE = 30;
const MAX_API_CACHE_SIZE = 20;

// Detect if user is on mobile/slow connection
function isMobileOrSlowConnection() {
  return (
    'connection' in navigator &&
    (navigator.connection.effectiveType === 'slow-2g' ||
     navigator.connection.effectiveType === '2g' ||
     navigator.connection.effectiveType === '3g')
  );
}

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  // Only log in production or when debugging
  if (self.location.hostname !== 'localhost') {
    console.log('Mobile SW: Install event');
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Only precache critical resources on mobile
      const criticalResources = [
        '/',
        '/favicon.ico',
        '/logo/hof-icon.svg',
        '/placeholder-image.png'
      ];
      
      return cache.addAll(criticalResources);
    })
  );
  
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  // Only log in production or when debugging
  if (self.location.hostname !== 'localhost') {
    console.log('Mobile SW: Activate event');
  }
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('Mobile SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - intercept requests with mobile optimization
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isMobile = isMobileOrSlowConnection();
  
  // Handle different types of requests
  if (event.request.destination === 'image' || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    // Image requests
    event.respondWith(handleImageRequest(event.request, isMobile));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests
    event.respondWith(handleApiRequest(event.request, isMobile));
  } else if (event.request.destination === 'document') {
    // HTML document requests
    event.respondWith(handleDocumentRequest(event.request, isMobile));
  } else if (event.request.destination === 'script' || 
             event.request.destination === 'style') {
    // Static asset requests
    event.respondWith(handleStaticRequest(event.request));
  }
});

// Mobile-optimized image request handler
async function handleImageRequest(request, isMobile = false) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Only log cache hits in production or when debugging
      if (self.location.hostname !== 'localhost') {
        console.log('Mobile SW: Serving image from cache:', request.url);
      }
      return cachedResponse;
    }

    // For mobile/slow connections, implement more aggressive caching
    if (isMobile) {
      // Try to find a similar cached image (different size/format)
      const keys = await cache.keys();
      const baseUrl = request.url.split('?')[0];
      const similarImage = keys.find(key => key.url.startsWith(baseUrl));
      
      if (similarImage) {
        const similarResponse = await cache.match(similarImage);
        if (similarResponse) {
          console.log('Mobile SW: Serving similar image from cache:', similarImage.url);
          return similarResponse;
        }
      }
    }

    // Fetch from network with timeout for mobile
    const fetchPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), isMobile ? 5000 : 10000);
    });
    
    const networkResponse = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      // More aggressive cleanup for mobile
      await cleanupImageCache(cache, isMobile);
      
      // Clone the response before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('Mobile SW: Cached image:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Mobile SW: Image fetch failed:', error);
    
    // Try to return cached version as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a placeholder for mobile
    if (isMobile) {
      return new Response(
        '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Image unavailable</text></svg>',
        {
          status: 200,
          headers: { 'Content-Type': 'image/svg+xml' }
        }
      );
    }
    
    return new Response('Image not available', { 
      status: 404, 
      statusText: 'Image not found' 
    });
  }
}

// API request handler with mobile optimization
async function handleApiRequest(request, isMobile = false) {
  const cache = await caches.open(API_CACHE_NAME);
  const url = new URL(request.url);
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  // Check for cacheable API endpoints
  const cacheableEndpoints = ['/api/cities', '/api/search', '/api/stats'];
  const isCacheable = cacheableEndpoints.some(endpoint => url.pathname.startsWith(endpoint));
  
  if (!isCacheable) {
    return fetch(request);
  }
  
  try {
    // For mobile, serve stale content while revalidating
    if (isMobile) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Serve cached response immediately
        console.log('Mobile SW: Serving API from cache:', request.url);
        
        // Update cache in background
        fetch(request).then(async (networkResponse) => {
          if (networkResponse.ok) {
            await cleanupApiCache(cache);
            await cache.put(request, networkResponse.clone());
          }
        }).catch(console.error);
        
        return cachedResponse;
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cleanupApiCache(cache);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Mobile SW: API fetch failed:', error);
    
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Document request handler
async function handleDocumentRequest(request, isMobile = false) {
  try {
    const networkResponse = await fetch(request);
    
    // For mobile, cache successful document responses
    if (isMobile && networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try to serve from cache on network failure
    if (isMobile) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Static asset request handler
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cleanupStaticCache(cache);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Mobile-optimized cache cleanup functions
async function cleanupImageCache(cache, isMobile = false) {
  const keys = await cache.keys();
  const maxSize = isMobile ? MAX_IMAGE_CACHE_SIZE / 2 : MAX_IMAGE_CACHE_SIZE;
  
  if (keys.length >= maxSize) {
    // For mobile, be more aggressive about cleanup
    const keysToDelete = keys.slice(0, keys.length - maxSize + (isMobile ? 15 : 10));
    
    await Promise.all(
      keysToDelete.map(key => {
        console.log('Mobile SW: Removing image from cache:', key.url);
        return cache.delete(key);
      })
    );
  }
}

async function cleanupApiCache(cache) {
  const keys = await cache.keys();
  
  if (keys.length >= MAX_API_CACHE_SIZE) {
    const keysToDelete = keys.slice(0, keys.length - MAX_API_CACHE_SIZE + 5);
    
    await Promise.all(
      keysToDelete.map(key => {
        console.log('Mobile SW: Removing API from cache:', key.url);
        return cache.delete(key);
      })
    );
  }
}

async function cleanupStaticCache(cache) {
  const keys = await cache.keys();
  
  if (keys.length >= MAX_STATIC_CACHE_SIZE) {
    const keysToDelete = keys.slice(0, keys.length - MAX_STATIC_CACHE_SIZE + 5);
    
    await Promise.all(
      keysToDelete.map(key => {
        console.log('Mobile SW: Removing static from cache:', key.url);
        return cache.delete(key);
      })
    );
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    clearAllCaches();
  } else if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    clearImageCache();
  } else if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
});

async function clearAllCaches() {
  try {
    const cacheNames = [CACHE_NAME, STATIC_CACHE_NAME, API_CACHE_NAME];
    
    await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        await Promise.all(keys.map(key => cache.delete(key)));
        console.log('Mobile SW: Cleared cache:', cacheName);
      })
    );
  } catch (error) {
    console.error('Mobile SW: Failed to clear caches:', error);
  }
}

async function clearImageCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
    console.log('Mobile SW: Image cache cleared');
  } catch (error) {
    console.error('Mobile SW: Failed to clear image cache:', error);
  }
}

async function getCacheStats() {
  try {
    const stats = {};
    const cacheNames = [
      { name: CACHE_NAME, type: 'images' },
      { name: STATIC_CACHE_NAME, type: 'static' },
      { name: API_CACHE_NAME, type: 'api' }
    ];
    
    for (const { name, type } of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats[type] = {
        count: keys.length,
        urls: keys.map(key => key.url).slice(0, 10) // First 10 URLs
      };
    }
    
    return stats;
  } catch (error) {
    console.error('Mobile SW: Failed to get cache stats:', error);
    return {};
  }
}