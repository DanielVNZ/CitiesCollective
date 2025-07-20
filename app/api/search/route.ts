import { NextRequest, NextResponse } from 'next/server';
import { searchCities, getSearchCitiesCount, getUniqueThemes, getUniqueGameModes, getContentCreators, SearchFilters } from 'app/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract search parameters
    const filters: SearchFilters = {
      query: searchParams.get('query') || undefined,
      theme: searchParams.get('theme') || undefined,
      gameMode: searchParams.get('gameMode') || undefined,
      contentCreator: searchParams.get('contentCreator') || undefined,
      sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'newest',
      sortOrder: (searchParams.get('sortOrder') as SearchFilters['sortOrder']) || 'desc',
    };
    
    // Handle withImages filter
    const withImages = searchParams.get('withImages');
    if (withImages === 'true') {
      filters.withImages = true;
    }
    
    // Handle numeric filters
    const minPopulation = searchParams.get('minPopulation');
    const maxPopulation = searchParams.get('maxPopulation');
    const minMoney = searchParams.get('minMoney');
    const maxMoney = searchParams.get('maxMoney');
    
    if (minPopulation) filters.minPopulation = parseInt(minPopulation);
    if (maxPopulation) filters.maxPopulation = parseInt(maxPopulation);
    if (minMoney) filters.minMoney = parseInt(minMoney);
    if (maxMoney) filters.maxMoney = parseInt(maxMoney);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;
    
    // Get cities and total count
    const [cities, totalCount] = await Promise.all([
      searchCities(filters, limit, offset),
      getSearchCitiesCount(filters)
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    return NextResponse.json({
      cities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filters: filters
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search cities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Endpoint to get filter options
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'getFilterOptions') {
      const [themes, gameModes, contentCreators] = await Promise.all([
        getUniqueThemes(),
        getUniqueGameModes(),
        getContentCreators()
      ]);
      
      return NextResponse.json({
        themes,
        gameModes,
        contentCreators: contentCreators.map(creator => ({
          value: creator.username,
          label: creator.username
        })),
        sortOptions: [
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'population', label: 'Population' },
          { value: 'money', label: 'Money' },
          { value: 'xp', label: 'XP' },
          { value: 'name', label: 'Name' }
        ]
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Search filter options error:', error);
    return NextResponse.json(
      { error: 'Failed to get filter options', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 