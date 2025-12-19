
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateCustomerSchema, type CreateCustomerInput } from "@/app/(app)/customers/new/customer.schema";
import type { Customer } from "@/types";

interface EditCustomerFormProps {
  customer: Customer;
  onSave: (data: CreateCustomerInput) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const loyaltyStatuses = ["None", "Bronze", "Silver", "Gold"] as const;
const priceBands = ["Standard", "Band A", "Band B", "Band C"] as const;

export function EditCustomerForm({ customer, onSave, onCancel, isSaving }: EditCustomerFormProps) {
  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      loyaltyStatus: customer.loyalty_status || "None",
      priceBand: customer.price_band || "Standard",
      smsOptIn: customer.sms_opt_in || false,
      emailOptIn: customer.email_opt_in || false,
      hasPreferredPricing: customer.has_preferred_pricing || false,
      isAccountClient: customer.is_account_client || false,
      accountId: customer.account_id || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      loyaltyStatus: customer.loyalty_status || "None",
      priceBand: customer.price_band || "Standard",
      smsOptIn: customer.sms_opt_in || false,
      emailOptIn: customer.email_opt_in || false,
      hasPreferredPricing: customer.has_preferred_pricing || false,
      isAccountClient: customer.is_account_client || false,
      accountId: customer.account_id || "",
    });
  }, [customer, form]);
  
  const watchedIsAccountClient = form.watch("isAccountClient");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g., 555-123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 123 Main St, Anytown, USA" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="loyaltyStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loyalty Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "None"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loyalty status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loyaltyStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceBand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Band</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "Standard"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price band" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priceBands.map(band => (
                      <SelectItem key={band} value={band}>{band}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-1 border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground">Preferences & Account Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="smsOptIn"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>SMS Opt-In</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailOptIn"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Email Opt-In</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hasPreferredPricing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Preferred Pricing</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isAccountClient"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Invoice Client</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        {watchedIsAccountClient && (
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter account ID for invoice client" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    