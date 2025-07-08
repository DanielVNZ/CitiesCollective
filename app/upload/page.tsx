import { auth } from 'app/auth';
import { redirect } from 'next/navigation';
import { UploadForm } from './UploadForm';

export default async function UploadPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <UploadForm />;
} 