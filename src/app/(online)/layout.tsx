import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnlinePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-4 bg-white border-b shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
           <Link href="/order" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span className="font-bold text-xl font-headline">XP Clean</span>
          </Link>
          <nav className="flex items-center space-x-2">
             <Button variant="ghost" asChild>
                <Link href="/order">New Order</Link>
            </Button>
            <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
                <Link href="/register">Create Account</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="container mx-auto">
            {children}
        </div>
      </main>
       <footer className="py-6 md:px-8 md:py-0 border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} XP Clean. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
