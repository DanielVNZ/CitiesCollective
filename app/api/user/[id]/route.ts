import { NextRequest, NextResponse } from 'next/server';
import { client } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const result = await client`
      SELECT id, email, username, "pdxUsername", "discordUsername", "isAdmin"
      FROM "User" 
      WHERE id = ${userId}`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return only public information (exclude email and isAdmin)
    const user = result[0];
    const publicUser = {
      id: user.id,
      username: user.username,
      pdxUsername: user.pdxUsername,
      discordUsername: user.discordUsername,
    };

    return NextResponse.json({ user: publicUser });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 