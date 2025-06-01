
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockCustomers } from '@/lib/data';
import type { Customer } from '@/types';
import Link from 'next/link';
import { Search, UserPlus, ArrowRight, Users } from 'lucide-react';

export default function FindOrAddCustomerPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const allCustomers = getMockCustomers(); // Get all customers once

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(true);
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(lowerSearchTerm) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(lowerSearchTerm))
    );
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleSelectCustomer = (customerId: string) => {
    router.push(`/orders/new?customerId=${customerId}`);
  };

  return (
    <div className="flex flex-col items-center justify-start pt-8">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl flex items-center justify-center">
            <Users className="mr-2 h-7 w-7" />
            Start New Order: Find or Add Customer
          </CardTitle>
          <CardDescription>
            Search for an existing customer or add a new one to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search by Name, Phone, or Email"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHasSearched(false); 
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} type="button">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>

          {hasSearched && searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-md font-semibold text-muted-foreground px-1">Search Results:</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-muted/20">
                {searchResults.map(customer => (
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

          {hasSearched && searchResults.length === 0 && searchTerm.trim() !== '' && (
            <p className="text-center text-muted-foreground py-4">
              No customer found matching your search.
            </p>
          )}

           {hasSearched && searchResults.length === 0 && searchTerm.trim() === '' && (
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
        </CardContent>
      </Card>
    </div>
  );
}
