
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomers } from "@/lib/data";
import { updateCustomerAccountDetailsAction } from "@/app/(auth)/settings/customer-actions.ts";
import type { Customer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Phone, Mail, Home, FileText, Briefcase, Save } from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onSave: (customerId: string, isAccountClient: boolean, accountId: string | null) => Promise<void>;
}

function CustomerRecordCard({ customer, onSave }: CustomerCardProps) {
  const [isAccountClient, setIsAccountClient] = useState(customer.is_account_client || false);
  const [accountId, setAccountId] = useState(customer.account_id || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(customer.id, isAccountClient, accountId || null);
    setIsSaving(false);
  };
  
  // Sync with prop changes
  useEffect(() => {
    setIsAccountClient(customer.is_account_client || false);
    setAccountId(customer.account_id || "");
  }, [customer.is_account_client, customer.account_id]);


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-headline">
          <UserCircle className="mr-2 h-5 w-5 text-primary" /> {customer.name}
        </CardTitle>
        <CardDescription>ID: {customer.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {customer.phone && <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /> {customer.phone}</div>}
        {customer.email && <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {customer.email}</div>}
        {customer.address && <div className="flex items-center"><Home className="mr-2 h-4 w-4 text-muted-foreground" /> {customer.address}</div>}
        
        <div className="border-t pt-3 mt-3 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center"><FileText className="mr-1.5 h-3 w-3"/> Transactions: (Placeholder for transaction list)</p>
            <p className="text-xs text-muted-foreground">Total Spend: $XXX.XX (Placeholder)</p>
        </div>

        <div className="border-t pt-3 mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`invoice-client-${customer.id}`} className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4"/> Invoice Only Client
            </Label>
            <Switch
              id={`invoice-client-${customer.id}`}
              checked={isAccountClient}
              onCheckedChange={setIsAccountClient}
            />
          </div>
          {isAccountClient && (
            <div>
              <Label htmlFor={`account-id-${customer.id}`}>Account ID</Label>
              <Input
                id={`account-id-${customer.id}`}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Enter Account ID"
                className="mt-1 h-8 text-xs"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} size="sm" className="w-full" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Account Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}


export function CustomerManagementTab() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filterName, setFilterName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterPostcode, setFilterPostcode] = useState(""); // Will search in address field

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const customersData = await getCustomers();
      setAllCustomers(customersData);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Error", description: "Could not load customer list.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      const nameMatch = filterName ? customer.name.toLowerCase().includes(filterName.toLowerCase()) : true;
      const phoneMatch = filterPhone ? customer.phone?.includes(filterPhone) : true;
      const postcodeMatch = filterPostcode ? customer.address?.toLowerCase().includes(filterPostcode.toLowerCase()) : true;
      return nameMatch && phoneMatch && postcodeMatch;
    });
  }, [allCustomers, filterName, filterPhone, filterPostcode]);

  const handleSaveChanges = async (customerId: string, isAccountClient: boolean, accountId: string | null) => {
    const result = await updateCustomerAccountDetailsAction({
      customerId,
      is_account_client: isAccountClient,
      account_id: accountId,
    });

    if (result.success && result.customer) {
      toast({ title: "Success", description: result.message });
      // Update the customer in the local state to reflect changes immediately
      setAllCustomers(prev => prev.map(c => c.id === customerId ? { ...c, is_account_client: result.customer?.is_account_client, account_id: result.customer?.account_id } : c));
    } else {
      toast({ title: "Error", description: result.message || "Failed to save changes.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Customers</CardTitle>
          <CardDescription>Search for customers by name, phone, or postcode (searches address field).</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <Input placeholder="Filter by Name..." value={filterName} onChange={(e) => setFilterName(e.target.value)} />
          <Input placeholder="Filter by Phone..." value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} />
          <Input placeholder="Filter by Postcode..." value={filterPostcode} onChange={(e) => setFilterPostcode(e.target.value)} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
          ))}
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <CustomerRecordCard key={customer.id} customer={customer} onSave={handleSaveChanges} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">No customers found matching your criteria, or no customers in the system.</p>
      )}
    </div>
  );
}
