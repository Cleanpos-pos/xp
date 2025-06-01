
"use client";

import React from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddCatalogEntrySchema, type AddCatalogEntryInput } from "@/app/(auth)/settings/catalog-actions";
import type { CatalogEntryType } from "@/types";

interface AddCatalogEntryFormProps {
  parentId: string | null;
  defaultType?: CatalogEntryType;
  onSuccess: () => void;
  submitAction: (data: AddCatalogEntryInput) => Promise<{ success: boolean; message?: string; errors?: any }>;
}

export function AddCatalogEntryForm({ parentId, defaultType = "category", onSuccess, submitAction }: AddCatalogEntryFormProps) {
  const form = useForm<AddCatalogEntryInput>({
    resolver: zodResolver(AddCatalogEntrySchema),
    defaultValues: {
      name: "",
      parentId: parentId,
      type: defaultType,
      price: 0,
      description: "",
    },
  });

  const watchedType = form.watch("type");

  async function onSubmit(data: AddCatalogEntryInput) {
    // Ensure price is undefined if type is category
    const submissionData = {
      ...data,
      price: data.type === "item" ? data.price : undefined,
    };

    const result = await submitAction(submissionData);
    if (result.success) {
      form.reset({
        name: "",
        parentId: parentId, // Keep parentId for potentially adding another under the same parent
        type: defaultType,
        price: 0,
        description: "",
      });
      onSuccess(); // Callback to refresh list or close modal
    } else {
      // Handle errors, potentially setting form errors if structured that way
      console.error("Failed to add catalog entry:", result.message, result.errors);
      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            const fieldName = err.path[0] as keyof AddCatalogEntryInput;
            form.setError(fieldName, { type: "manual", message: err.message });
          }
        });
      }
       // Fallback for general error message
      if (result.message && !result.errors) {
         form.setError("root", { message: result.message });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="category" />
                    </FormControl>
                    <FormLabel className="font-normal">Category</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="item" />
                    </FormControl>
                    <FormLabel className="font-normal">Item/Service</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{watchedType === "category" ? "Category Name" : "Item/Service Name"}</FormLabel>
              <FormControl>
                <Input placeholder={watchedType === "category" ? "e.g., Menswear, Alterations" : "e.g., Linen Trousers, Shirt Press"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {watchedType === "item" && (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 12.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Brief description" {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         {form.formState.errors.root && (
            <FormMessage>{form.formState.errors.root.message}</FormMessage>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          {form.formState.isSubmitting ? "Saving..." : `Add ${watchedType === "category" ? "Category" : "Item"}`}
        </Button>
      </form>
    </Form>
  );
}
