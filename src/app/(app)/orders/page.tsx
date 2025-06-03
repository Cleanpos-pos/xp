
"use client"; // Needs to be client component for useEffect and useState

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllOrdersDb } from '@/lib/data'; // Fetch from Supabase
import type { Order, OrderStatus } from '@/types';
import { Eye, Pencil, MoreHorizontal, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'Completed':
      return 'default'; 
    case 'Ready for Pickup':
      return 'secondary'; 
    case 'Cleaning':
    case 'Alterations':
    case 'Processing':
      return 'outline'; 
    case 'Received':
      return 'outline';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

const statusColors: Record<OrderStatus, string> = {
  Received: "bg-blue-100 text-blue-700 border-blue-300",
  Processing: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Cleaning: "bg-indigo-100 text-indigo-700 border-indigo-300",
  Alterations: "bg-purple-100 text-purple-700 border-purple-300",
  "Ready for Pickup": "bg-green-100 text-green-700 border-green-300",
  Completed: "bg-gray-200 text-gray-800 border-gray-400", 
  Cancelled: "bg-red-100 text-red-700 border-red-300", 
};


export default function OrderTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllOrdersDb();
        setOrders(data);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(7)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
          <CardTitle className="font-headline">Order Tracking</CardTitle>
          <CardDescription>Monitor the status of all customer orders.</CardDescription>
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
          <CardTitle className="font-headline">Order Tracking</CardTitle>
          <CardDescription>Monitor the status of all customer orders (from Supabase).</CardDescription>
        </div>
        <Link href="/orders/new">
          <Button>Create New Order</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  {order.orderNumber}
                  {order.isExpress && <Badge variant="destructive" className="ml-2 text-xs"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                <TableCell>{order.dueDate ? format(new Date(order.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.status)} className={`${statusColors[order.status]} transition-all duration-300 ease-in-out`}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/orders/${order.id}${order.isExpress ? '?express=true' : ''}`} className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled> {/* Edit status to be implemented */}
                        <Pencil className="mr-2 h-4 w-4" /> Edit Status
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {orders.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            No orders found. Create new orders to see them listed here.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{orders.length}</strong> orders.
        </div>
      </CardFooter>
    </Card>
  );
}

    