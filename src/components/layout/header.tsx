
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SheetTrigger } from '@/components/ui/sheet'; // For mobile sidebar
import { PanelLeft } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';

export function AppHeader() {
  const router = useRouter(); // Get the router instance

  const handleLogout = () => {
    // Implement actual logout logic here later, e.g., clearing auth tokens
    console.log("Logging out...");
    router.push('/'); // Redirect to login page
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print-hidden app-header-print-hidden">
      <SidebarTrigger className="sm:hidden" />
      {/* Added Logout Button */}
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Logout
      </Button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold font-headline">XP Clean</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Avatar>
              <AvatarImage src="https://placehold.co/32x32.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>XP</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            {/* Placeholder for support link, can be enabled later */}
            {/* <Link href="/support">Support</Link> */}
            Support (Coming Soon)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Modified Dropdown Logout Item */}
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
