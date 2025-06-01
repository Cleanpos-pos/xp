
import { redirect } from 'next/navigation';

export default function AppRootPlaceholderPage() {
  // This page serves as the root for the (app) authenticated section.
  // It immediately redirects to the main dashboard.
  redirect('/dashboard');
  
  // Although redirect() is called, Next.js App Router pages
  // should return null or valid JSX.
  return null;
}
