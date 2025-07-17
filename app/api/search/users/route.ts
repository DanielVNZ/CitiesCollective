import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersWithStats } from '@/app/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ users: [] });
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Get all users and filter by username
    const allUsers = await getAllUsersWithStats();
    
    const filteredUsers = allUsers
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

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 