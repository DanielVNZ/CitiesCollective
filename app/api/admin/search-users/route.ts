import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, db } from 'app/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isUserAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const searchTerm = query.trim().toLowerCase();
    
    // Search for users by username or email
    const users = await db.execute(sql`
      SELECT id, email, username 
      FROM "User" 
      WHERE LOWER(username) LIKE ${`%${searchTerm}%`} 
         OR LOWER(email) LIKE ${`%${searchTerm}%`}
      ORDER BY username, email
      LIMIT 10
    `);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 