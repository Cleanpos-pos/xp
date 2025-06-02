
"use client"; // Needs to be client component for useEffect and useState

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInventoryItems } from '@/lib/data'; // Now fetches from Supabase
import type { InventoryItem } from '@/types';
import { Package, Edit, MoreHorizontal, AlertTriangle, ShoppingCart } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInventoryItems();
        setInventory(data);
      } catch (err: any) {
        console.error("Failed to fetch inventory:", err);
        setError("Failed to load inventory. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const getStockLevel = (item: InventoryItem) => {
    if (item.low_stock_threshold === undefined || item.low_stock_threshold === null || item.low_stock_threshold === 0) return 'normal'; // Treat 0 or undefined threshold as normal
    if (item.quantity <= item.low_stock_threshold) return 'low';
    if (item.quantity <= item.low_stock_threshold * 1.5) return 'medium';
    return 'high';
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-32" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Inventory Tracking</CardTitle>
          <CardDescription>Manage your supplies and track usage.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center py-8">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Inventory Tracking</CardTitle>
          <CardDescription>Manage your supplies and track usage (from Supabase).</CardDescription>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/order-supplies">
            <Button variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" /> Order Business Supplies
            </Button>
          </Link>
          <Link href="/inventory/new">
            <Button>Add New Item</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const stockLevel = getStockLevel(item);
              const progressValue = (item.low_stock_threshold && item.low_stock_threshold > 0)
                ? Math.min((item.quantity / (item.low_stock_threshold * 2)) * 100, 100)
                : 50; // Default progress if no threshold
              
              let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
              let badgeClass = "";
              if (stockLevel === 'low') {
                badgeVariant = 'destructive';
                badgeClass = 'bg-red-100 text-red-700 border-red-300';
              } else if (stockLevel === 'medium') {
                badgeVariant = 'outline';
                 badgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
              } else if (stockLevel === 'high') {
                badgeClass = 'bg-green-100 text-green-700 border-green-300';
              } else { // normal
                badgeVariant = 'secondary';
                badgeClass = 'bg-blue-100 text-blue-700 border-blue-300';
              }

              return (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium flex items-center">
                    <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                    {item.name}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progressValue} className={cn("w-24 h-2", 
                        stockLevel === 'low' && '[&>div]:bg-destructive',
                        stockLevel === 'medium' && '[&>div]:bg-yellow-400',
                        stockLevel === 'high' && '[&>div]:bg-green-500',
                        stockLevel === 'normal' && '[&>div]:bg-blue-500'
                      )} />
                      {stockLevel === 'low' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                          <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                        </Badge>
                      )}
                       {stockLevel === 'medium' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                         Medium
                        </Badge>
                      )}
                       {stockLevel === 'high' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                         High
                        </Badge>
                      )}
                       {stockLevel === 'normal' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                         Normal
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled> {/* Edit/Delete to be implemented */}
                          <Edit className="mr-2 h-4 w-4" /> Edit Item (Soon)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
         {inventory.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            No inventory items found. Add items using the "Add New Item" button.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{inventory.length}</strong> inventory items.
        </div>
      </CardFooter>
    </Card>
  );
}
