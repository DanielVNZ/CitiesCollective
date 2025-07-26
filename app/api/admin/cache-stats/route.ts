import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin } from 'app/db';
import { getCacheStats, logCacheStats } from 'app/utils/query-cache';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const stats = getCacheStats();
    
    // Log stats to console for monitoring
    logCacheStats();
    
    return NextResponse.json({
      cacheStats: {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        totalQueries: stats.totalQueries,
        hits: stats.hits,
        misses: stats.misses,
        evictions: stats.evictions,
        memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve cache statistics' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { clearCache } = await import('app/utils/query-cache');
    clearCache();
    
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ 
      error: 'Failed to clear cache' 
    }, { status: 500 });
  }
}