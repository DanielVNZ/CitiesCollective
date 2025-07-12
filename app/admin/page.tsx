import Link from 'next/link';
import { auth } from 'app/auth';
import { redirect } from 'next/navigation';
import { isUserAdmin, getAllUsersWithStats, getTotalCityCount, getAllComments } from 'app/db';
import { AdminUserManagement } from './AdminUserManagement';
import { CommentModeration } from './CommentModeration';
import { ModerationSettings } from './ModerationSettings';
import { UserCityManagement } from './UserCityManagement';
import ApiKeyManagement from './ApiKeyManagement';
import { Header } from 'app/components/Header';
import { AdminPageClient } from './AdminPageClient';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user is admin
  const isAdmin = await isUserAdmin(session.user.email);
  if (!isAdmin) {
    redirect('/');
  }

  // Get all users with their stats
  const usersWithStats = await getAllUsersWithStats();
  const totalCityCount = await getTotalCityCount();
  const allComments = await getAllComments();

  return (
    <AdminPageClient 
      session={session}
      isAdmin={isAdmin}
      usersWithStats={usersWithStats}
      totalCityCount={totalCityCount}
      allComments={allComments}
    />
  );
} 