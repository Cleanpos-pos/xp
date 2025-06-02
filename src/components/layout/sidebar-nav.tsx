
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardPlus,
  Shirt,
  Users,
  Tags,
  FileText,
  Archive,
  Settings,
  Search, // Keep Search icon if we rename "Find or Add Customer"
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroup,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // The /find-or-add-customer page now handles both customer and order finding
  { href: '/find-or-add-customer', label: 'Find Customer/Order', icon: Search }, 
  { href: '/orders/new', label: 'New Order (Direct)', icon: ClipboardPlus }, // Kept for direct access if needed, or can be removed
  { href: '/orders', label: 'Order Tracking', icon: Shirt },
  { href: '/customers', label: 'Customer List', icon: Users }, // Renamed for clarity
  { href: '/services', label: 'Services', icon: Tags },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/inventory', label: 'Inventory', icon: Archive },
];

// Removed '/find-ticket' as its functionality is merged.

export function SidebarNav() {
  const pathname = usePathname();

  const renderNavItems = (items: typeof navItems) => items.map((item) => {
    const Icon = item.icon;
    // For dashboard, exact match. For others, startsWith.
    // Special handling for /find-or-add-customer as it's a primary interaction point now
    const isActive = item.href === '/dashboard' ? pathname === item.href 
                    : item.href === '/find-or-add-customer' ? pathname.startsWith(item.href) || pathname === '/orders/new' // Also active if on new order page as it's often the next step
                    : (item.href !== '/' && pathname.startsWith(item.href));
    
    return (
      <SidebarMenuItem key={item.href}>
        <Link href={item.href} legacyBehavior passHref>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={item.label}
            className="justify-start"
          >
            <a>
              <Icon className="mr-2 h-5 w-5 flex-shrink-0" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {item.label}
              </span>
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  });

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
        <SidebarMenu>{renderNavItems(navItems)}</SidebarMenu>
      </SidebarGroup>
    </>
  );
}

    