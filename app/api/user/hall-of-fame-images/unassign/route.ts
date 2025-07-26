import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, client } from 'app/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { hofImageId } = await request.json();
    if (!hofImageId) {
      return NextResponse.json({ error: 'Missing hofImageId' }, { status: 400 });
    }

    // Remove the assignment from the database
    await client`
      DELETE FROM "hallOfFameCache" 
      WHERE "hofImageId" = ${hofImageId} AND "cityId" IN (
        SELECT id FROM "City" WHERE "userId" = ${user.id}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Image unassigned successfully' 
    });
  } catch (error) {
    console.error('Error unassigning hall of fame image:', error);
    return NextResponse.json({ 
      error: 'Failed to unassign image', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 