import { NextRequest, NextResponse } from 'next/server';

export interface CacheConfig {
  maxAge: number; // in seconds
  staleWhileRevalidate?: number; // in seconds
  tags?: string[];
  public?: boolean;
}

/**
 * Add cache headers to API responses
 */
export function addCacheHeaders(response: NextResponse, config: CacheConfig): NextResponse {
  const { maxAge, staleWhileRevalidate, tags, public: isPublic = true } = config;
  
  // Build Cache-Control header
  const cacheControlParts = [];
  
  if (isPublic) {
    cacheControlParts.push('public');
  } else {
    cacheControlParts.push('private');
  }
  
  cacheControlParts.push(`max-age=${maxAge}`);
  
  if (staleWhileRevalidate) {
    cacheControlParts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  
  response.headers.set('Cache-Control', cacheControlParts.join(', '));
  
  // Add cache tags for Next.js revalidation
  if (tags && tags.length > 0) {
    response.headers.set('Cache-Tags', tags.join(', '));
  }
  
  // Add ETag for conditional requests
  const etag = generateETag(response);
  if (etag) {
    response.headers.set('ETag', etag);
  }
  
  return response;
}

/**
 * Create a cached API response wrapper
 */
export function withCache(config: CacheConfig) {
  return function cacheWrapper(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return async function cachedHandler(req: NextRequest, ...args: any[]): Promise<NextResponse> {
      // Check for conditional requests
      const ifNoneMatch = req.headers.get('If-None-Match');
      
      // Execute the handler
      const response = await handler(req, ...args);
      
      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        const cachedResponse = addCacheHeaders(response, config);
        
        // Handle conditional requests
        if (ifNoneMatch) {
          const etag = cachedResponse.headers.get('ETag');
          if (etag && ifNoneMatch === etag) {
            return new NextResponse(null, { 
              status: 304,
              headers: {
                'Cache-Control': cachedResponse.headers.get('Cache-Control') || '',
                'ETag': etag
              }
            });
          }
        }
        
        return cachedResponse;
      }
      
      return response;
    };
  };
}

/**
 * Generate ETag for response content
 */
function generateETag(response: NextResponse): string | null {
  try {
    // For JSON responses, create ETag based on content
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      // Simple hash of the response body
      const body = JSON.stringify(response);
      return `"${hashString(body)}"`;
    }
  } catch (error) {
    console.warn('Failed to generate ETag:', error);
  }
  return null;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Predefined cache configurations for common use cases
 */
export const CacheConfigs = {
  // Short cache for frequently changing data
  SHORT: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30,
    public: true
  } as CacheConfig,
  
  // Medium cache for moderately changing data
  MEDIUM: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60,
    public: true
  } as CacheConfig,
  
  // Long cache for rarely changing data
  LONG: {
    maxAge: 900, // 15 minutes
    staleWhileRevalidate: 300,
    public: true
  } as CacheConfig,
  
  // Static data that changes infrequently
  STATIC: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 1800,
    public: true
  } as CacheConfig,
  
  // Private data that shouldn't be cached by CDNs
  PRIVATE: {
    maxAge: 60,
    public: false
  } as CacheConfig
};