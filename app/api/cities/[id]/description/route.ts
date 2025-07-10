import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, updateCityDescription, getCityById } from 'app/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const users = await getUser(session.user.email);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const body = await request.json();
    const { description } = body;

    if (typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    // Update the city description
    const updatedCity = await updateCityDescription(cityId, user.id, description);
    
    if (!updatedCity) {
      return NextResponse.json({ error: 'City not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      city: updatedCity 
    });

  } catch (error) {
    console.error('Error updating city description:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 