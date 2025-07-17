import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersWithStats } from '@/app/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Get all users
    const allUsers = await getAllUsersWithStats();
    
    let filteredUsers;
    
    if (!query || query.trim().length === 0) {
      // Show 5 random users when no query
      const shuffled = allUsers.sort(() => 0.5 - Math.random());
      filteredUsers = shuffled
        .filter(user => user.username)
        .slice(0, 5)
        .map(user => ({
          id: user.id,
          username: user.username,
          email: user.email
        }));
    } else {
      // Filter by search term
      const searchTerm = query.trim().toLowerCase();
      filteredUsers = allUsers
        .filter(user => 
          user.username && 
          user.username.toLowerCase().includes(searchTerm)
        )
        .slice(0, 10) // Limit to 10 results
        .map(user => ({
          id: user.id,
          username: user.username,
          email: user.email
        }));
    }

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 