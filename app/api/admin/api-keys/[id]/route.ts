import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { isUserAdmin, deleteApiKey } from 'app/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isUserAdmin(session.user.email);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const keyId = parseInt(params.id);
    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid API key ID' }, { status: 400 });
    }

    // Delete API key (admin can delete any key)
    await deleteApiKey(keyId, 0); // 0 means admin deletion

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 