
import { redirect } from 'next/navigation';

// This page component handles the old /login route.
// Since the main login page is now at the root ('/'),
// we redirect any traffic to /login to / to ensure users
// see the correct login screen.
export default function LoginPageRedirect() {
  redirect('/'); // Redirect to the root login page
  return null; // Pages in Next.js App Router must return null or JSX
}
