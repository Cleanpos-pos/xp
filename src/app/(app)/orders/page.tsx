
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getMockOrders } from '@/lib/data';
import type { Order, OrderStatus } from '@/types';
import { Eye, Pencil, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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
  const orders: Order[] = getMockOrders();

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Order Tracking</CardTitle>
          <CardDescription>Monitor the status of all customer orders.</CardDescription>
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
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
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
                        <Link href={`/orders/${order.id}`} className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Status
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{orders.length}</strong> orders.
        </div>
      </CardFooter>
    </Card>
  );
}
