import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalQueries: number;
  hitRate: number;
  memoryUsage: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalQueries: 0,
    hitRate: 0,
    memoryUsage: 0
  };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Generate cache key from query and parameters
  private generateKey(query: string, params: any[] = []): string {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const keyData = JSON.stringify({ query: normalizedQuery, params });
    return crypto.createHash('md5').update(keyData).digest('hex');
  }

  // Check if cache entry is expired
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Clean up expired entries
  private cleanup(): void {
    let evicted = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        evicted++;
      }
    }
    
    this.stats.evictions += evicted;
    this.updateStats();
    
    if (evicted > 0 && (process.env.NODE_ENV === 'production' || process.env.DB_DEBUG === 'true')) {
      console.log(`Query cache cleanup: evicted ${evicted} expired entries`);
    }
  }

  // Evict least recently used entries when cache is full
  private evictLRU(): void {
    if (this.cache.size <= this.maxSize) return;
    
    // Sort by hit count and timestamp (LRU)
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const aScore = a[1].hitCount + (a[1].timestamp / 1000000); // Favor recent and frequently used
      const bScore = b[1].hitCount + (b[1].timestamp / 1000000);
      return aScore - bScore;
    });
    
    // Remove oldest entries
    const toRemove = this.cache.size - this.maxSize + 1;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  // Update cache statistics
  private updateStats(): void {
    this.stats.totalQueries = this.stats.hits + this.stats.misses;
    this.stats.hitRate = this.stats.totalQueries > 0 ? 
      (this.stats.hits / this.stats.totalQueries) * 100 : 0;
    
    // Estimate memory usage (rough calculation)
    this.stats.memoryUsage = this.cache.size * 1024; // Assume 1KB per entry average
  }

  // Get cached result
  get<T>(query: string, params: any[] = []): T | null {
    const key = this.generateKey(query, params);
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      this.stats.misses++;
      if (entry) {
        this.cache.delete(key); // Remove expired entry
      }
      this.updateStats();
      return null;
    }
    
    // Update hit count and stats
    entry.hitCount++;
    entry.timestamp = Date.now(); // Update access time for LRU
    this.stats.hits++;
    this.updateStats();
    
    return entry.data;
  }

  // Set cache entry
  set<T>(query: string, params: any[], data: T, ttlMs: number = 5 * 60 * 1000): void {
    const key = this.generateKey(query, params);
    
    // Evict if necessary
    this.evictLRU();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hitCount: 0,
      key
    };
    
    this.cache.set(key, entry);
    this.updateStats();
  }

  // Invalidate cache entries by pattern
  invalidate(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern, 'i');
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (regex.test(entry.key) || regex.test(JSON.stringify(entry.data))) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    this.stats.evictions += invalidated;
    this.updateStats();
    
    return invalidated;
  }

  // Clear all cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;
    this.updateStats();
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Destroy cache and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const queryCache = new QueryCache(1000); // Max 1000 cached queries

// Cache wrapper for database queries
export async function cachedQuery<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  params: any[] = [],
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Try to get from cache first
  const cached = queryCache.get<T>(cacheKey, params);
  if (cached !== null) {
    return cached;
  }
  
  // Execute query and cache result
  const result = await queryFn();
  queryCache.set(cacheKey, params, result, ttlMs);
  
  return result;
}

// Cache invalidation helpers
export function invalidateCache(pattern: string): number {
  return queryCache.invalidate(pattern);
}

export function clearCache(): void {
  queryCache.clear();
}

export function getCacheStats(): CacheStats {
  return queryCache.getStats();
}

// Specific cache invalidation functions for common operations
export function invalidateCityCache(cityId?: number): void {
  if (cityId) {
    invalidateCache(`city.*${cityId}`);
  } else {
    invalidateCache('city');
  }
  invalidateCache('recent.*cities');
  invalidateCache('popular.*cities');
  invalidateCache('search_cities');
  invalidateCache('cities_by_user');
  invalidateCache('city_count_by_user');
  invalidateCache('stats');
}

export function invalidateUserCache(userId?: number): void {
  if (userId) {
    invalidateCache(`user.*${userId}`);
    invalidateCache(`cities_by_user.*${userId}`);
    invalidateCache(`city_count_by_user.*${userId}`);
  } else {
    invalidateCache('user');
    invalidateCache('cities_by_user');
    invalidateCache('city_count_by_user');
  }
  invalidateCache('user_by_id');
  invalidateCache('stats');
}

export function invalidateCommunityCache(): void {
  invalidateCache('likes');
  invalidateCache('comments');
  invalidateCache('favorites');
  invalidateCache('search_cities');
  invalidateCache('recent.*cities');
  invalidateCache('stats');
}

// Cache monitoring and reporting
export function logCacheStats(): void {
  const stats = getCacheStats();
  console.log('Query Cache Statistics:', {
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    totalQueries: stats.totalQueries,
    hits: stats.hits,
    misses: stats.misses,
    evictions: stats.evictions,
    cacheSize: queryCache.size(),
    memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)} KB`
  });
}

// Periodic cache statistics logging (every 10 minutes in production)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logCacheStats();
  }, 10 * 60 * 1000);
}

// Cache warming function for frequently accessed data
export async function warmCache(): Promise<void> {
  try {
    // Import database functions dynamically to avoid circular dependencies
    const { getCommunityStats, getTotalCityCount, getTotalUserCount } = await import('../db');
    
    if (process.env.NODE_ENV === 'production' || process.env.DB_DEBUG === 'true') {
      console.log('Warming cache with frequently accessed data...');
    }
    
    // Warm up community stats
    await getCommunityStats();
    
    // Warm up basic counts
    await getTotalCityCount();
    await getTotalUserCount();
    
    if (process.env.NODE_ENV === 'production' || process.env.DB_DEBUG === 'true') {
      console.log('Cache warming completed');
    }
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

// Export cache instance for advanced usage
export { queryCache };

// Cleanup on process exit
process.on('exit', () => {
  queryCache.destroy();
});

process.on('SIGTERM', () => {
  queryCache.destroy();
});

process.on('SIGINT', () => {
  queryCache.destroy();
});