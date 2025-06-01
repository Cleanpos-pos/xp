
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusCircle, Edit3, Trash2, GripVertical } from "lucide-react";
import type { CatalogHierarchyNode, CatalogEntryType } from "@/types";
import { getCatalogHierarchyAction, addCatalogEntryAction } from "@/app/(auth)/settings/catalog-actions";
import { AddCatalogEntryForm } from "./add-catalog-entry-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface RenderNodeProps {
  node: CatalogHierarchyNode;
  onAddEntry: (parentId: string, type: CatalogEntryType) => void;
  level: number;
}

function CatalogNodeDisplay({ node, onAddEntry, level }: RenderNodeProps) {
  const { toast } = useToast();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addFormType, setAddFormType] = useState<CatalogEntryType>("category");

  const handleOpenAddForm = (type: CatalogEntryType) => {
    setAddFormType(type);
    setIsAddFormOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddFormOpen(false);
    toast({ title: "Success", description: `${addFormType === "category" ? "Category" : "Item"} added.`});
    // Parent component will handle re-fetching data
  };

  return (
    <AccordionItem value={node.id} key={node.id} className="mb-2 border rounded-md shadow-sm bg-background">
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {/* Placeholder for drag handle */}
            {/* <GripVertical className="h-5 w-5 text-muted-foreground mr-2 cursor-grab" /> */}
            <span className="font-medium">{node.name}</span>
            {node.type === "item" && node.price !== undefined && (
              <span className="ml-2 text-sm text-muted-foreground">${node.price.toFixed(2)}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="h-4 w-4" /></Button> */}
            {/* <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button> */}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-3 border-t">
        <div className="space-y-3 pl-4">
          {node.children && node.children.length > 0 && (
            <Accordion type="multiple" className="w-full">
              {node.children.map(childNode => (
                <CatalogNodeDisplay
                  key={childNode.id}
                  node={childNode}
                  onAddEntry={onAddEntry}
                  level={level + 1}
                />
              ))}
            </Accordion>
          )}
          {node.children?.length === 0 && node.type === 'category' && (
            <p className="text-sm text-muted-foreground italic py-2">This category is empty.</p>
          )}

          {node.type === "category" && (
             <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
              <DialogTrigger asChild>
                <div className="mt-2 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenAddForm("category")}>
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Add Sub-category
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenAddForm("item")}>
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Add Item/Service
                    </Button>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New {addFormType === 'category' ? 'Sub-category' : 'Item/Service'} to {node.name}</DialogTitle>
                </DialogHeader>
                <AddCatalogEntryForm
                  parentId={node.id}
                  defaultType={addFormType}
                  onSuccess={() => {
                    handleAddSuccess();
                    onAddEntry(node.id, addFormType); // Trigger re-fetch in parent
                  }}
                  submitAction={addCatalogEntryAction}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}


export function CatalogManagementTab() {
  const [catalogHierarchy, setCatalogHierarchy] = useState<CatalogHierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTopLevelFormOpen, setIsAddTopLevelFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const hierarchy = await getCatalogHierarchyAction();
      setCatalogHierarchy(hierarchy);
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
      toast({ title: "Error", description: "Could not load catalog data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleAddSuccess = () => {
    setIsAddTopLevelFormOpen(false);
    toast({ title: "Success", description: "New top-level category added."});
    fetchCatalog(); // Re-fetch the whole catalog
  };
  
  const handleSubEntryAdded = () => {
    fetchCatalog(); // Re-fetch the whole catalog when a sub-entry is added
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={isAddTopLevelFormOpen} onOpenChange={setIsAddTopLevelFormOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Top-Level Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Top-Level Category</DialogTitle>
          </DialogHeader>
          <AddCatalogEntryForm
            parentId={null}
            defaultType="category"
            onSuccess={handleAddSuccess}
            submitAction={addCatalogEntryAction}
          />
        </DialogContent>
      </Dialog>

      {catalogHierarchy.length === 0 ? (
        <p className="text-muted-foreground">No categories found. Start by adding a top-level category.</p>
      ) : (
        <Accordion type="multiple" className="w-full space-y-1">
          {catalogHierarchy.map(node => (
            <CatalogNodeDisplay key={node.id} node={node} onAddEntry={handleSubEntryAdded} level={0} />
          ))}
        </Accordion>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Drag &amp; drop sorting for categories and items will be implemented in a future update. Edit and Delete functionality also pending.
      </p>
    </div>
  );
}
