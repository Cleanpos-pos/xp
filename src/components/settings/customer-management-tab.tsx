
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomers } from "@/lib/data";
import { updateCustomerAction } from "@/app/(auth)/settings/customer-actions";
import type { Customer } from "@/types";
import type { CreateCustomerInput } from "@/app/(app)/customers/new/customer.schema";
import { useToast } from "@/hooks/use-toast";
import { Edit3, UserCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditCustomerForm } from "./edit-customer-form"; // Import the new form

export function CustomerManagementTab() {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filterName, setFilterName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterPostcode, setFilterPostcode] = useState("");

  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCustomers, filterName, filterPhone, filterPostcode]);

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomerToEdit(customer);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedCustomerToEdit(null);
    setIsEditModalOpen(false);
  };

  const handleSaveChanges = async (updatedData: CreateCustomerInput) => {
    if (!selectedCustomerToEdit) return;
    setIsSaving(true);
    const result = await updateCustomerAction(selectedCustomerToEdit.id, updatedData);
    setIsSaving(false);

    if (result.success && result.customer) {
      toast({ title: "Success", description: result.message });
      fetchCustomers(); // Re-fetch to get the latest list with updates
      handleCloseEditModal();
    } else {
      let errorMessages = result.message || "Failed to save changes.";
      if (result.errors) {
          errorMessages += " " + result.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      }
      toast({ title: "Error", description: errorMessages, variant: "destructive" });
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
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filteredCustomers.length > 0 ? (
        <Card>
          <CardHeader>
             <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
             <CardDescription>Click 'Edit' to modify customer details.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(customer)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-muted-foreground py-8">No customers found matching your criteria, or no customers in the system.</p>
      )}

      {selectedCustomerToEdit && (
        <Dialog open={isEditModalOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCloseEditModal(); else setIsEditModalOpen(true);}}>
          <DialogContent className="sm:max-w-2xl"> {/* Increased width for the form */}
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserCircle className="mr-2 h-6 w-6 text-primary" />
                Edit Customer: {selectedCustomerToEdit.name}
              </DialogTitle>
              <DialogDescription>
                Modify the details for this customer. Changes will be saved to the database.
              </DialogDescription>
            </DialogHeader>
            
            <EditCustomerForm
              customer={selectedCustomerToEdit}
              onSave={handleSaveChanges}
              onCancel={handleCloseEditModal}
              isSaving={isSaving}
            />
            
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
