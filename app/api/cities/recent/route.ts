import { NextRequest, NextResponse } from 'next/server';
import { getRecentCities } from 'app/db';
import { withCache, CacheConfigs } from 'app/utils/api-cache-middleware';

export const GET = withCache({
  ...CacheConfigs.MEDIUM,
  tags: ['cities', 'recent-cities']
})(async function(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '9');
    const offset = parseInt(searchParams.get('offset') || '0');
    const withImages = searchParams.get('withImages') === 'true';

    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json({ error: 'Invalid limit or offset' }, { status: 400 });
    }

    const cities = await getRecentCities(limit, offset, withImages);

    return NextResponse.json({
      cities,
      limit,
      offset,
      count: cities.length,
    });

  } catch (error) {
    console.error('Get recent cities error:', error);
    return NextResponse.json({ 
      error: 'Failed to get recent cities', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}); 