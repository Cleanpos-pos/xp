
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
  Settings, // Imported Settings icon
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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/find-or-add-customer', label: 'Find Customer/Order', icon: Search },
  { href: '/orders/new', label: 'New Order (Direct)', icon: ClipboardPlus },
  { href: '/orders', label: 'Order Tracking', icon: Shirt },
  { href: '/customers', label: 'Customer List', icon: Users },
  { href: '/services', label: 'Services', icon: Tags },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/inventory', label: 'Inventory', icon: Archive },
  { href: '/settings', label: 'Settings', icon: Settings }, // Added Settings link
];

export function SidebarNav() {
  const pathname = usePathname();

  const renderNavItems = (items: typeof navItems) => items.map((item) => {
    const Icon = item.icon;
    const isActive = item.href === '/dashboard' ? pathname === item.href
                    : item.href === '/find-or-add-customer' ? pathname.startsWith(item.href) || pathname === '/orders/new'
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
