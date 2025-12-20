
"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCircle, ShoppingCart, ArrowRight, Ticket } from "lucide-react";
import { searchOrdersDb, getOrdersByCustomerIdDb } from '@/lib/data'; // Use DB functions
import type { Order } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function FindTicketPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      toast({ title: "Search Term Required", description: "Please enter something to search for.", variant: "default" });
      setSearchResults([]);
      setSelectedCustomerOrders([]);
      setSelectedCustomerName(null);
      setSelectedCustomerId(null);
      setHasSearched(true);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    setSelectedCustomerOrders([]); 
    setSelectedCustomerName(null);
    setSelectedCustomerId(null);

    try {
      const results = await searchOrdersDb(searchTerm); // Use Supabase search
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No Results", description: "No orders found matching your search.", variant: "default" });
      }
    } catch (error) {
      console.error("Error searching orders:", error);
      toast({ title: "Search Error", description: "Could not perform order search.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, toast]);

  const handleOrderSelect = useCallback(async (order: Order) => {
    setIsLoading(true);
    setSelectedCustomerName(order.customerName);
    setSelectedCustomerId(order.customerId);
    setSearchResults([]); 

    try {
      const customerOrders = await getOrdersByCustomerIdDb(order.customerId); // Use Supabase fetch
      setSelectedCustomerOrders(customerOrders);
      if (customerOrders.length === 0) {
         toast({ title: "No Orders for Customer", description: `No orders found for ${order.customerName}.`, variant: "default" });
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      toast({ title: "Error", description: "Could not fetch orders for this customer.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const handleProceedToNewOrder = () => {
    if (selectedCustomerId) {
      router.push(`/orders/new?customerId=${selectedCustomerId}`);
    }
  };

  const renderOrderStatusBadge = (status: Order['status']) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    if (status === "Completed") variant = "default";
    else if (status === "Ready for Pickup") variant = "secondary";
    else if (status === "Cancelled") variant = "destructive";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Ticket className="mr-2 h-6 w-6" /> Find Ticket / Order
          </CardTitle>
          <CardDescription>
            Search by Order #, Customer Name, or Customer ID. Barcode scanners emulating keyboard input can be used here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter Order #, Name, Customer ID..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="button" onClick={handleSearch} disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {!isLoading && searchResults.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Initial Search Results</CardTitle>
            <CardDescription>Click an order to see all orders for that customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map(order => (
                  <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOrderSelect(order)}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{renderOrderStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" size="sm" className="p-0 h-auto">View Customer's Orders <ArrowRight className="ml-1 h-3 w-3"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && selectedCustomerOrders.length > 0 && selectedCustomerName && (
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline text-xl flex items-center">
                        <UserCircle className="mr-2 h-6 w-6 text-primary"/> Orders for {selectedCustomerName}
                    </CardTitle>
                    <CardDescription>All orders found for this customer. You can proceed to create a new order or view existing ones.</CardDescription>
                </div>
                <Button onClick={handleProceedToNewOrder} disabled={!selectedCustomerId}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> Start New Order for {selectedCustomerName.split(' ')[0]}
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                   <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCustomerOrders.map(order => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{order.dueDate ? format(new Date(order.dueDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                    <TableCell>£{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{renderOrderStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                        {order.paymentStatus || 'N/A'}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                        <Link href={`/orders/${order.id}`} passHref>
                           <Button variant="ghost" size="icon"><ArrowRight className="h-4 w-4" /></Button>
                        </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
                Displaying {selectedCustomerOrders.length} order(s) for {selectedCustomerName}.
            </p>
          </CardFooter>
        </Card>
      )}
      
      {!isLoading && hasSearched && searchResults.length === 0 && selectedCustomerOrders.length === 0 && (
         <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                <p>No orders found for your search term "{searchTerm}".</p>
                <p className="text-xs mt-1">Try a different order number, customer name, or customer ID.</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}

    