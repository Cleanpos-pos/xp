
"use client";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCustomerSchema, type CreateCustomerInput } from "./customer.schema";
import { createCustomerAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const loyaltyStatuses = ["None", "Bronze", "Silver", "Gold"] as const;
const priceBands = ["Standard", "Band A", "Band B", "Band C"] as const;


export default function NewCustomerPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      loyaltyStatus: "None",
      priceBand: "Standard",
    },
  });

  async function onSubmit(data: CreateCustomerInput) {
    const result = await createCustomerAction(data);
    if (result.success && result.customerId) {
      toast({
        title: "Customer Created",
        description: result.message,
      });
      router.push(`/orders/new?customerId=${result.customerId}`); 
    } else {
      toast({
        title: "Error",
        description: result.errors ? JSON.stringify(result.errors) : "Failed to create customer. Please check the form.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Add New Customer</CardTitle>
        <CardDescription>Enter the details for the new customer.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <Textarea placeholder="e.g., 123 Main St, Anytown, USA" {...field} />
                  </FormControl>
                  <FormDescription>
                    Customer's physical address if needed for delivery or records.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="loyaltyStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyalty Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "None"}>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value || "Standard"}>
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adding Customer..." : "Add Customer & Start Order"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
