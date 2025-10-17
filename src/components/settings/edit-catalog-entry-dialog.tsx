
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { UpdateCatalogEntrySchema, type UpdateCatalogEntryData } from "@/app/settings/catalog.schema";
import { updateCatalogEntryAction } from "@/app/settings/catalog-actions";
import type { CatalogHierarchyNode } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface EditCatalogEntryDialogProps {
  entry: CatalogHierarchyNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCatalogEntryDialog({ entry, isOpen, onOpenChange, onSuccess }: EditCatalogEntryDialogProps) {
  const { toast } = useToast();
  const form = useForm<UpdateCatalogEntryData>({
    resolver: zodResolver(UpdateCatalogEntrySchema),
    defaultValues: {
      name: entry.name || "",
      price: entry.type === "item" ? (entry.price ?? 0) : undefined,
      description: entry.description || "",
      has_color_identifier: entry.type === "item" ? (entry.has_color_identifier ?? false) : undefined,
      small_tags_to_print: entry.type === "item" ? (entry.small_tags_to_print ?? 1) : undefined,
    },
  });

  useEffect(() => {
    form.reset({
      name: entry.name || "",
      price: entry.type === "item" ? (entry.price ?? 0) : undefined,
      description: entry.description || "",
      has_color_identifier: entry.type === "item" ? (entry.has_color_identifier ?? false) : undefined,
      small_tags_to_print: entry.type === "item" ? (entry.small_tags_to_print ?? 1) : undefined,
    });
  }, [entry, form, isOpen]); // Reset form when entry or isOpen changes

  async function onSubmit(data: UpdateCatalogEntryData) {
    const submissionData: UpdateCatalogEntryData = {
      ...data,
      price: entry.type === "item" ? (data.price ?? undefined) : undefined,
      has_color_identifier: entry.type === "item" ? (data.has_color_identifier ?? false) : undefined,
      small_tags_to_print: entry.type === 'item' ? (data.small_tags_to_print ?? 1) : undefined,
    };

    if (entry.type === "item" && (submissionData.price === undefined || submissionData.price <=0) ) {
        form.setError("price", {message: "Items must have a positive price."});
        return;
    }

    const result = await updateCatalogEntryAction(entry.id, submissionData);
    if (result.success) {
      toast({ title: "Success", description: result.message || "Entry updated." });
      onSuccess();
      onOpenChange(false); // Close dialog
    } else {
      toast({ title: "Error", description: result.message || "Failed to update entry.", variant: "destructive" });
      if (result.errors) {
        result.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            form.setError(err.path[0] as keyof UpdateCatalogEntryData, { message: err.message });
          } else {
            form.setError("root", { message: err.message });
          }
        });
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {entry.type === "category" ? "Category" : "Item/Service"}: {entry.name}</DialogTitle>
          <DialogDescription>
            Make changes to this catalog entry. Type cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder={entry.type === "category" ? "Category name" : "Item/Service name"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {entry.type === "item" && (
              <>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (£)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 12.99" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="small_tags_to_print"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Small Tags to Print</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" min="0" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                      </FormControl>
                      <FormDescription>Number of small tags to print for this item.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="has_color_identifier"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Needs Color Specification?</FormLabel>
                         <FormDescription className="text-xs">
                            If enabled, a color can be specified when adding this item to an order.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
                <FormMessage>{form.formState.errors.root.message}</FormMessage>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
