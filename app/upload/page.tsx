import { auth } from 'app/auth';
import { redirect } from 'next/navigation';
import { UploadForm } from './UploadForm';
import { Header } from 'app/components/Header';
import { isUserAdmin } from 'app/db';

export default async function UploadPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const isAdmin = session?.user?.email ? await isUserAdmin(session.user.email) : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header session={session} isAdmin={isAdmin} />
      
      {/* Upload Form */}
      <UploadForm />
    </div>
  );
} 