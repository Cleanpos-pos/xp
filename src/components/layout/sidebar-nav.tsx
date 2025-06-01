
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
  Search,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroup,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders/new', label: 'New Order', icon: ClipboardPlus },
  { href: '/orders', label: 'Order Tracking', icon: Shirt },
  { href: '/find-ticket', label: 'Find Ticket', icon: Search },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/services', label: 'Services', icon: Tags },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/inventory', label: 'Inventory', icon: Archive },
];

const secondaryNavItems = [
 { href: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  const renderNavItems = (items: typeof navItems) => items.map((item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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
      {/* Example of a secondary group, can be used for settings, help etc. */}
      {/* <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>System</SidebarGroupLabel>
        <SidebarMenu>{renderNavItems(secondaryNavItems)}</SidebarMenu>
      </SidebarGroup> */}
    </>
  );
}

    