
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
import { AddCatalogEntrySchema, type AddCatalogEntryInput } from "@/app/(auth)/settings/catalog.schema";
import type { CatalogEntryType } from "@/types";

interface AddCatalogEntryFormProps {
  parent_id: string | null;
  defaultType?: CatalogEntryType;
  onSuccess: () => void;
  submitAction: (data: AddCatalogEntryInput) => Promise<{ success: boolean; message?: string; errors?: any }>;
}

export function AddCatalogEntryForm({ parent_id, defaultType = "category", onSuccess, submitAction }: AddCatalogEntryFormProps) {
  const form = useForm<AddCatalogEntryInput>({
    resolver: zodResolver(AddCatalogEntrySchema),
    defaultValues: {
      name: "",
      parent_id: parent_id,
      type: defaultType,
      price: 0,
      description: "",
      has_color_identifier: false, // Explicitly default for items if form is used directly
    },
  });

  const watchedType = form.watch("type");

  // Reset has_color_identifier when type changes
  React.useEffect(() => {
    if (watchedType === "category") {
      form.setValue("has_color_identifier", undefined); // Should be undefined for categories
      form.setValue("price", undefined);
    } else {
      // For items, ensure a default if it became undefined
      if (form.getValues("has_color_identifier") === undefined) {
        form.setValue("has_color_identifier", false);
      }
      if (form.getValues("price") === undefined) {
        form.setValue("price", 0);
      }
    }
  }, [watchedType, form]);

  async function onSubmit(data: AddCatalogEntryInput) {
    const submissionData = {
      ...data,
      price: data.type === "item" ? data.price : undefined,
      // has_color_identifier will be based on form values (defaulted to false for item)
      // or undefined if it's a category (due to useEffect hook)
    };

    const result = await submitAction(submissionData);
    if (result.success) {
      form.reset({
        name: "",
        parent_id: parent_id,
        type: defaultType,
        price: 0,
        description: "",
        has_color_identifier: defaultType === 'item' ? false : undefined,
      });
      onSuccess();
    } else {
      console.error("Failed to add catalog entry:", result.message, result.errors);
      if (result.errors && Array.isArray(result.errors)) {
        result.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            const fieldName = err.path[0] as keyof AddCatalogEntryInput;
            form.setError(fieldName, { type: "manual", message: err.message });
          }
        });
      }
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Trigger re-evaluation of dependent fields
                    if (value === "category") {
                      form.setValue("price", undefined);
                      form.setValue("has_color_identifier", undefined);
                    } else {
                      form.setValue("price", form.getValues("price") ?? 0);
                      form.setValue("has_color_identifier", form.getValues("has_color_identifier") ?? false);
                    }
                  }}
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
          <>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 12.99" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Placeholder for a Switch if you want to edit has_color_identifier in this form
            <FormField
              control={form.control}
              name="has_color_identifier"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <FormLabel>Needs Color Specification?</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            */}
          </>
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
