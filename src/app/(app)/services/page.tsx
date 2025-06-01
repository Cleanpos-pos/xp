
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getMockServices } from '@/lib/data'; // This is now async
import type { ServiceItem } from '@/types';
import { Tag, DollarSign, Edit, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMockServices(); // getMockServices is now async
        setServices(data);
      } catch (err: any) {
        console.error("Failed to fetch services:", err);
        setError("Failed to load services. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
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
                {[...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
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
          <CardTitle className="font-headline">Pricing and Services</CardTitle>
          <CardDescription>Manage your cleaning and alteration services.</CardDescription>
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
          <CardTitle className="font-headline">Pricing and Services</CardTitle>
          <CardDescription>Manage your cleaning and alteration services (from Supabase Catalog).</CardDescription>
        </div>
        <Link href="/settings"> {/* Link to settings to add new catalog items */}
          <Button>Manage Catalog</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                  {service.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{service.category}</Badge>
                </TableCell>
                <TableCell className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
                  {service.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled> {/* Edit/Delete via Catalog Management for now */}
                        <Edit className="mr-2 h-4 w-4" /> Edit Service (via Catalog)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {services.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-8">
            No services found. Add items to your catalog in Settings.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{services.length}</strong> services.
        </div>
      </CardFooter>
    </Card>
  );
}
