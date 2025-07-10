import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUserNotifications, getUnreadNotificationCount, markAllNotificationsAsRead } from 'app/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's ID
    const { getUser } = await import('app/db');
    const users = await getUser(session.user.email);
    const currentUser = users[0];
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get notifications and unread count
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(currentUser.id, limit, offset),
      getUnreadNotificationCount(currentUser.id)
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    });

  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's ID
    const { getUser } = await import('app/db');
    const users = await getUser(session.user.email);
    const currentUser = users[0];
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { action } = await request.json();

    if (action === 'markAllRead') {
      await markAllNotificationsAsRead(currentUser.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 