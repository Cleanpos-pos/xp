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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInventoryItemSchema, type CreateInventoryItemInput, createInventoryItemAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function NewInventoryItemPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CreateInventoryItemInput>({
    resolver: zodResolver(CreateInventoryItemSchema),
    defaultValues: {
      name: "",
      quantity: 0,
      unit: "",
      lowStockThreshold: 0,
    },
  });

  async function onSubmit(data: CreateInventoryItemInput) {
    const result = await createInventoryItemAction(data);
    if (result.success) {
      toast({
        title: "Inventory Item Added",
        description: result.message,
      });
      router.push("/inventory");
    } else {
      toast({
        title: "Error",
        description: "Failed to add inventory item. Please check the form.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Add New Inventory Item</CardTitle>
        <CardDescription>Track a new supply item used in your business.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hangers - Plastic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measurement</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., pieces, kg, liters" {...field} />
                    </FormControl>
                    <FormDescription>
                      How this item is measured (e.g., pieces, kg, liters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Threshold (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 20" {...field} />
                  </FormControl>
                  <FormDescription>
                    Get alerted when stock falls below this level. Leave 0 if not needed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adding Item..." : "Add Inventory Item"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
