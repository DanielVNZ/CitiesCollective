import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsernameOrEmail } from '@/app/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const users = await getUserByUsernameOrEmail(username.trim());
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      userId: users[0].id,
      username: users[0].username,
      email: users[0].email
    });
  } catch (error) {
    console.error('Error finding user by username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 