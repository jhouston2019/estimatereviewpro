import { redirect } from 'next/navigation';

export default function UploadPage() {
  // Redirect to unified upload page
  // All upload functionality has been consolidated to /upload
  redirect('/upload');
}
