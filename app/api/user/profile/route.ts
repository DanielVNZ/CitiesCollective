import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { client } from 'app/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pdxUsername, discordUsername } = await request.json();

    // Validate input
    if (pdxUsername && typeof pdxUsername !== 'string') {
      return NextResponse.json({ error: 'PDX username must be a string' }, { status: 400 });
    }
    
    if (discordUsername && typeof discordUsername !== 'string') {
      return NextResponse.json({ error: 'Discord username must be a string' }, { status: 400 });
    }

    // Update user profile
    const result = await client`
      UPDATE "User" 
      SET "pdxUsername" = ${pdxUsername || null}, 
          "discordUsername" = ${discordUsername || null}
      WHERE email = ${session.user.email}
      RETURNING id, email, username, "pdxUsername", "discordUsername", "isAdmin"`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: result[0] 
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await client`
      SELECT id, email, username, "pdxUsername", "discordUsername", "isAdmin"
      FROM "User" 
      WHERE email = ${session.user.email}`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result[0] });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 