
"use client"; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllOrdersDb } from '@/lib/data'; 
import type { Order, OrderStatus } from '@/types';
import { Eye, Pencil, MoreHorizontal, Zap, Printer, CalendarIcon, CheckCircle, TrendingUp, TrendingDown, DollarSign, ListChecks, Clock4 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import React, { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { updateOrderStatusAction } from './actions'; 
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from "@/components/ui/label"; // <<<<------ THE CRITICAL IMPORT

function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'Completed': return 'default'; 
    case 'Ready for Pickup': return 'secondary'; 
    case 'Cleaning': case 'Alterations': case 'Processing': case 'Received': return 'outline'; 
    case 'Cancelled': return 'destructive';
    default: return 'outline';
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
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllOrdersDb();
        setAllOrders(data);
      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) {
      return allOrders;
    }
    return allOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const sDate = startDate ? startOfDay(startDate) : null;
      const eDate = endDate ? endOfDay(endDate) : null;

      if (sDate && eDate) return isWithinInterval(orderDate, { start: sDate, end: eDate });
      if (sDate) return orderDate >= sDate;
      if (eDate) return orderDate <= eDate;
      return true;
    });
  }, [allOrders, startDate, endDate]);

  const summaryStats = useMemo(() => {
    const total = filteredOrders.length;
    const paid = filteredOrders.filter(o => o.paymentStatus === 'Paid').length;
    const toPay = filteredOrders.filter(o => o.paymentStatus === 'Unpaid' || o.paymentStatus === 'Processing Payment').length;
    return { total, paid, toPay };
  }, [filteredOrders]);

  const handleSetDateRange = (start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
    setIsStartDatePickerOpen(false);
    setIsEndDatePickerOpen(false);
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleMarkAsReady = async (orderId: string) => {
    const originalOrder = allOrders.find(o => o.id === orderId);
    if (!originalOrder || originalOrder.status === 'Ready for Pickup' || originalOrder.status === 'Completed' || originalOrder.status === 'Cancelled') {
      toast({ title: "Cannot Update Status", description: "Order is already ready, completed, or cancelled.", variant: "default" });
      return;
    }

    // Optimistic UI update
    setAllOrders(prevOrders => 
      prevOrders.map(o => o.id === orderId ? { ...o, status: 'Ready for Pickup' } : o)
    );

    const result = await updateOrderStatusAction(orderId, 'Ready for Pickup');
    if (result.success) {
      toast({
        title: "Order Status Updated",
        description: `Order ${result.order?.orderNumber || orderId} marked as Ready for Pickup.`,
      });
      // Placeholder for SMS: console.log("TODO: Send SMS for order ready - ", orderId);
      // If server returns updated order, could use that, otherwise optimistic update is fine.
      // If re-fetching: fetchOrders(); 
    } else {
      toast({
        title: "Error Updating Status",
        description: result.message || "Could not update order status.",
        variant: "destructive",
      });
      // Revert optimistic update on error
      setAllOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? originalOrder : o)
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="print-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
            <Skeleton className="h-10 w-36" />
          </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-3 print-hidden">
          {[...Array(3)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-24 mb-1"/><Skeleton className="h-8 w-16"/></CardHeader></Card>)}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader><TableRow>{[...Array(7)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}</TableRow></TableHeader>
              <TableBody>{[...Array(5)].map((_, i) => (<TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Card className="shadow-lg"><CardHeader><CardTitle className="font-headline">Order Tracking</CardTitle><CardDescription>Monitor the status of all customer orders.</CardDescription></CardHeader><CardContent><p className="text-destructive text-center py-8">{error}</p></CardContent></Card>;
  }
  
  return (
    <div className="space-y-6">
      <Card className="shadow-lg print-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Order Tracking</CardTitle>
            <CardDescription>Monitor and manage all customer orders. Filter by date below.</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePrintList} variant="outline"><Printer className="mr-2 h-4 w-4"/> Print List</Button>
            <Link href="/orders/new"><Button>Create New Order</Button></Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                    <Label htmlFor="startDate" className="text-xs">From Date</Label>
                    <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                        <PopoverTrigger asChild>
                        <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal mt-1">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PPP') : <span>Pick start date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={(date) => {setStartDate(date); setIsStartDatePickerOpen(false);}} disabled={(date) => endDate ? date > endDate : false} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="endDate" className="text-xs">To Date</Label>
                    <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                        <PopoverTrigger asChild>
                        <Button id="endDate" variant="outline" className="w-full justify-start text-left font-normal mt-1">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PPP') : <span>Pick end date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={(date) => {setEndDate(date); setIsEndDatePickerOpen(false);}} disabled={(date) => startDate ? date < startDate : false} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <Button onClick={() => handleSetDateRange(startOfDay(new Date()), endOfDay(new Date()))} variant="secondary" size="sm">Today</Button>
                    <Button onClick={() => handleSetDateRange(startOfWeek(new Date(), {weekStartsOn: 1}), endOfWeek(new Date(), {weekStartsOn: 1}))} variant="secondary" size="sm">This Week</Button>
                    <Button onClick={() => handleSetDateRange(startOfMonth(new Date()), endOfMonth(new Date()))} variant="secondary" size="sm">This Month</Button>
                    <Button onClick={() => handleSetDateRange(undefined, undefined)} variant="ghost" size="sm">Clear Dates</Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print-hidden">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.paid}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders to Pay</CardTitle>
            <Clock4 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summaryStats.toPay}</div></CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader className="print-visible-only hidden pt-4">
          <CardTitle className="font-headline">Orders List</CardTitle>
          <CardDescription>
            {startDate && endDate ? `Showing orders from ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}` :
             startDate ? `Showing orders from ${format(startDate, 'PPP')}` :
             endDate ? `Showing orders up to ${format(endDate, 'PPP')}` : 
             'Showing all orders'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 sm:pt-6"> {/* Adjusted padding for print vs screen */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right print-hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
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
                  <TableCell className="text-right space-x-1 print-hidden">
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleMarkAsReady(order.id)}
                        disabled={order.status === 'Ready for Pickup' || order.status === 'Completed' || order.status === 'Cancelled'}
                        className={cn(order.status === 'Ready for Pickup' && "bg-green-100 text-green-700 hover:bg-green-200")}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Mark Ready
                      </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/orders/${order.id}${order.isExpress ? '?express=true' : ''}`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled> 
                          <Pencil className="mr-2 h-4 w-4" /> Edit Order (Soon)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {filteredOrders.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              No orders found for the selected criteria.
            </p>
          )}
        </CardContent>
        <CardFooter className="print-hidden">
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredOrders.length}</strong> of <strong>{allOrders.length}</strong> total orders.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

    