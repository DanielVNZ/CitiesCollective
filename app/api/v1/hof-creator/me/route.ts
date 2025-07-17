import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersWithHoFCreatorId, getCitiesByUser } from '@/app/db';

export async function GET(request: NextRequest) {
  try {
    // Get the Creator ID from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('CreatorID ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use format: Authorization: CreatorID <your-creator-id>' },
        { status: 401 }
      );
    }

    const creatorId = authHeader.replace('CreatorID ', '').trim();
    
    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 401 }
      );
    }

    // Get all users with Hall of Fame Creator IDs and find the matching one
    const usersWithCreatorIds = await getAllUsersWithHoFCreatorId();
    const user = usersWithCreatorIds.find(u => u.hofCreatorId === creatorId);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid Creator ID or user not found' },
        { status: 404 }
      );
    }

    // Get all cities for this user
    const cities = await getCitiesByUser(user.id);

    // Return user information with cities
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        hofCreatorId: user.hofCreatorId,
        cities: cities.map(city => ({
          id: city.id,
          name: city.cityName
        }))
      }
    });

  } catch (error) {
    console.error('Error in HoF Creator API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 