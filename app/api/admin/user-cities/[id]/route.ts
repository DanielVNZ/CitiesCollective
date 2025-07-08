import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, getCitiesByUser } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isUserAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = parseInt(params.id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const cities = await getCitiesByUser(userId);
    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching user cities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 