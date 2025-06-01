
"use client"; // Required for usePathname

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import Link from 'next/link';
import { Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsPage = pathname === '/settings';
  const logoHref = isSettingsPage ? '/login' : '/';

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
          <div className="absolute top-6 left-6">
            <Link href={logoHref} className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="font-bold text-xl font-headline">XP Clean</span>
            </Link>
          </div>
          {!isSettingsPage && ( // Only show cog icon if not on settings page itself
            <div className="absolute top-6 right-6">
              <Link href="/settings" passHref>
                <Button variant="ghost" size="icon" aria-label="Staff Management Settings">
                  <Cog className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          )}
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
