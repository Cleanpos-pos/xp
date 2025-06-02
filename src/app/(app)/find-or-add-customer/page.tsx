
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getCustomers, searchOrdersLocal, getOrdersByCustomerIdLocal } from '@/lib/data';
import type { Customer, Order } from '@/types';
import { Search, UserPlus, ArrowRight, Users, Ticket, Eye, ShoppingCart, UserCircle, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type SearchType = "customer" | "order";

export default function FindCustomerOrOrderPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Common states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<SearchType>("customer");

  // Customer search states
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [hasCustomerSearched, setHasCustomerSearched] = useState(false);

  // Order search states
  const [orderSearchResults, setOrderSearchResults] = useState<Order[]>([]);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[]>([]);
  const [selectedCustomerNameForOrders, setSelectedCustomerNameForOrders] = useState<string | null>(null);
  const [selectedCustomerIdForOrders, setSelectedCustomerIdForOrders] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [hasOrderSearched, setHasOrderSearched] = useState(false);

  const fetchAllCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const customers = await getCustomers();
      setAllCustomers(customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Error", description: "Could not load customer list.", variant: "destructive" });
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "customer") {
      fetchAllCustomers();
    }
  }, [activeTab, fetchAllCustomers]);

  const handleSearch = async () => {
    const term = searchTerm.trim();
    if (!term) {
      if (activeTab === "customer") {
        setCustomerSearchResults([]);
        setHasCustomerSearched(true);
      } else {
        setOrderSearchResults([]);
        setSelectedCustomerOrders([]);
        setSelectedCustomerNameForOrders(null);
        setSelectedCustomerIdForOrders(null);
        setHasOrderSearched(true);
      }
      toast({ title: "Search Term Required", description: "Please enter something to search for.", variant: "default" });
      return;
    }

    if (activeTab === "customer") {
      setIsLoadingCustomers(true);
      setHasCustomerSearched(true);
      const lowerSearchTerm = term.toLowerCase();
      const results = allCustomers.filter(customer =>
        customer.name.toLowerCase().includes(lowerSearchTerm) ||
        (customer.phone && customer.phone.includes(term)) ||
        (customer.email && customer.email.toLowerCase().includes(lowerSearchTerm))
      );
      setCustomerSearchResults(results);
      setIsLoadingCustomers(false);
    } else { // Order search
      setIsLoadingOrders(true);
      setHasOrderSearched(true);
      setSelectedCustomerOrders([]);
      setSelectedCustomerNameForOrders(null);
      setSelectedCustomerIdForOrders(null);
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const results = searchOrdersLocal(term);
      setOrderSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No Results", description: "No orders found matching your search.", variant: "default" });
      }
      setIsLoadingOrders(false);
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    router.push(`/orders/new?customerId=${customerId}`);
  };

  const handleOrderSelect = useCallback((order: Order) => {
    setIsLoadingOrders(true);
    setSelectedCustomerNameForOrders(order.customerName);
    setSelectedCustomerIdForOrders(order.customerId);
    setOrderSearchResults([]); // Clear initial search results

    setTimeout(() => {
      const customerOrders = getOrdersByCustomerIdLocal(order.customerId);
      setSelectedCustomerOrders(customerOrders);
      setIsLoadingOrders(false);
      if (customerOrders.length === 0) {
         toast({ title: "No Orders for Customer", description: `No orders found for ${order.customerName}.`, variant: "default" });
      }
    }, 300); // Simulate API delay
  }, [toast]);

  const handleProceedToNewOrderForCustomer = () => {
    if (selectedCustomerIdForOrders) {
      router.push(`/orders/new?customerId=${selectedCustomerIdForOrders}`);
    }
  };

  const renderOrderStatusBadge = (status: Order['status']) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    if (status === "Completed") variant = "default";
    else if (status === "Ready for Pickup") variant = "secondary";
    else if (status === "Cancelled") variant = "destructive";
    return <Badge variant={variant}>{status}</Badge>;
  };
  
  const inputPlaceholder = useMemo(() => {
    if (activeTab === 'customer') return "Search by Name, Phone, or Email";
    return "Search by Order #, Customer Name, or ID";
  }, [activeTab]);

  return (
    <div className="flex flex-col items-center justify-start pt-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl flex items-center justify-center">
            <Search className="mr-2 h-7 w-7" />
            Find Customer or Order/Ticket
          </CardTitle>
          <CardDescription>
            Search for an existing customer to start a new order, or look up an existing order/ticket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SearchType)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer"><Users className="mr-2 h-4 w-4" />Find Customer</TabsTrigger>
              <TabsTrigger value="order"><Ticket className="mr-2 h-4 w-4" />Find Order/Ticket</TabsTrigger>
            </TabsList>

            <div className="mt-6 mb-2 flex items-center space-x-2">
              <Input
                type="text"
                placeholder={inputPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeTab === 'customer') setHasCustomerSearched(false);
                  else setHasOrderSearched(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                disabled={activeTab === 'customer' ? isLoadingCustomers : isLoadingOrders}
              />
              <Button onClick={handleSearch} type="button" disabled={activeTab === 'customer' ? isLoadingCustomers : isLoadingOrders}>
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </div>
            
            <TabsContent value="customer" className="mt-0">
              {isLoadingCustomers && !hasCustomerSearched && (
                <div className="space-y-2 pt-4">
                  {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              )}
              {!isLoadingCustomers && hasCustomerSearched && customerSearchResults.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-md font-semibold text-muted-foreground px-1">Customer Search Results:</h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/20">
                    {customerSearchResults.map(customer => (
                      <li key={customer.id} className="p-3 border-b last:border-b-0 bg-background rounded-md shadow-sm hover:bg-accent/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {customer.phone || customer.email || 'No contact info'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectCustomer(customer.id)}
                          >
                            Start Order <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!isLoadingCustomers && hasCustomerSearched && customerSearchResults.length === 0 && searchTerm.trim() !== '' && (
                <p className="text-center text-muted-foreground py-4">
                  No customer found matching your search.
                </p>
              )}
              {!isLoadingCustomers && hasCustomerSearched && customerSearchResults.length === 0 && searchTerm.trim() === '' && (
                <p className="text-center text-muted-foreground py-4">
                  Enter a search term to find a customer or add a new one below.
                </p>
              )}
              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-3 text-center">Can't find the customer or need to add a new one?</p>
                <Link href="/customers/new" passHref className="w-full">
                  <Button variant="secondary" className="w-full">
                    <UserPlus className="mr-2 h-5 w-5" /> Add New Customer
                  </Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="order" className="mt-0">
              {isLoadingOrders && (
                <div className="space-y-2 pt-4">
                   {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}

              {!isLoadingOrders && orderSearchResults.length > 0 && (
                <Card className="shadow-sm mt-4">
                  <CardHeader className="p-4">
                    <CardTitle className="font-headline text-lg">Initial Order Search Results</CardTitle>
                    <CardDescription className="text-xs">Click an order to see all orders for that customer.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Order #</TableHead>
                          <TableHead className="text-xs">Customer</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderSearchResults.map(order => (
                          <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOrderSelect(order)}>
                            <TableCell className="text-xs py-2">{order.orderNumber}</TableCell>
                            <TableCell className="text-xs py-2">{order.customerName}</TableCell>
                            <TableCell className="text-xs py-2">{format(new Date(order.created_at), 'MMM dd, yy')}</TableCell>
                            <TableCell className="text-xs py-2">{renderOrderStatusBadge(order.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {!isLoadingOrders && selectedCustomerOrders.length > 0 && selectedCustomerNameForOrders && (
                <Card className="shadow-sm mt-4">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-lg flex items-center">
                                <UserCircle className="mr-1.5 h-5 w-5 text-primary"/> Orders for {selectedCustomerNameForOrders}
                            </CardTitle>
                            <CardDescription className="text-xs">All orders found for this customer.</CardDescription>
                        </div>
                        <Button size="sm" onClick={handleProceedToNewOrderForCustomer} disabled={!selectedCustomerIdForOrders}>
                            <ShoppingCart className="mr-1.5 h-4 w-4" /> New Order for {selectedCustomerNameForOrders.split(' ')[0]}
                        </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Order #</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Total</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCustomerOrders.map(order => (
                          <TableRow key={order.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-xs py-2">{order.orderNumber}</TableCell>
                            <TableCell className="text-xs py-2">{format(new Date(order.created_at), 'MMM dd, yy')}</TableCell>
                            <TableCell className="text-xs py-2">${order.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-xs py-2">{renderOrderStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-right text-xs py-2">
                              <Link href={`/orders/${order.id}`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="p-2">
                    <p className="text-xs text-muted-foreground">
                        Displaying {selectedCustomerOrders.length} order(s).
                    </p>
                  </CardFooter>
                </Card>
              )}
              
              {!isLoadingOrders && hasOrderSearched && orderSearchResults.length === 0 && selectedCustomerOrders.length === 0 && searchTerm.trim() !== '' && (
                 <p className="text-center text-muted-foreground py-4">
                    No orders found for your search term "{searchTerm}".
                 </p>
              )}
               {!isLoadingOrders && hasOrderSearched && orderSearchResults.length === 0 && selectedCustomerOrders.length === 0 && searchTerm.trim() === '' && (
                <p className="text-center text-muted-foreground py-4">
                  Enter a search term (Order #, Customer Name, or Customer ID) to find an order/ticket.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center pt-4 border-t">
          <Link href="/dashboard" passHref>
            <Button variant="outline">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
