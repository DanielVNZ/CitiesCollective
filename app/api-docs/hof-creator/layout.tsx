import { auth } from 'app/auth';
import { redirect } from 'next/navigation';
import { isUserAdmin, isUserContentCreator } from 'app/db';

export default async function HoFCreatorApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user is admin or content creator (VIP)
  const [isAdmin, isContentCreator] = await Promise.all([
    isUserAdmin(session.user.email),
    isUserContentCreator(session.user.email)
  ]);

  if (!isAdmin && !isContentCreator) {
    redirect('/');
  }

  return <>{children}</>;
} 