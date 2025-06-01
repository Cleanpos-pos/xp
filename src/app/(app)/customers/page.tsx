
"use client"; // Needs to be client component for useEffect and useState

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getCustomers } from '@/lib/data'; // Now fetches from Supabase
import type { Customer } from '@/types';
import { Eye, Pencil, MoreHorizontal, Phone, Mail, Star, Tag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err: any) {
        console.error("Failed to fetch customers:", err);
        setError("Failed to load customers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomers();
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
          <CardTitle className="font-headline">Customer Management</CardTitle>
          <CardDescription>View and manage your customer database.</CardDescription>
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
          <CardTitle className="font-headline">Customer Management</CardTitle>
          <CardDescription>View and manage your customer database (from Supabase).</CardDescription>
        </div>
        <Link href="/customers/new">
          <Button>Add New Customer</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  {customer.phone && <div className="flex items-center text-sm"><Phone className="w-3 h-3 mr-1.5 text-muted-foreground" /> {customer.phone}</div>}
                  {customer.email && <div className="flex items-center text-sm text-muted-foreground"><Mail className="w-3 h-3 mr-1.5" /> {customer.email}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {customer.loyalty_status && customer.loyalty_status !== "None" && (
                      <Badge variant="secondary" className="flex items-center w-fit">
                        <Star className="w-3 h-3 mr-1" /> {customer.loyalty_status}
                      </Badge>
                    )}
                    {customer.price_band && customer.price_band !== "Standard" && (
                      <Badge variant="outline" className="flex items-center w-fit">
                        <Tag className="w-3 h-3 mr-1" /> {customer.price_band}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{customer.created_at ? format(new Date(customer.created_at), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                       <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Customer
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
          Showing <strong>{customers.length}</strong> customers.
        </div>
      </CardFooter>
    </Card>
  );
}
