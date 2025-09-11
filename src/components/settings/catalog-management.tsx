
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusCircle, Edit3, Trash2, Tag } from "lucide-react";
import type { CatalogHierarchyNode, CatalogEntryType } from "@/types";
import { getCatalogHierarchyAction, addCatalogEntryAction, deleteCatalogEntryAction } from "@/app/(auth)/settings/catalog-actions";
import { AddCatalogEntryForm } from "./add-catalog-entry-form";
import { EditCatalogEntryDialog } from "./edit-catalog-entry-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog as AddDialog, DialogContent as AddDialogContent, DialogHeader as AddDialogHeader, DialogTitle as AddDialogTitle, DialogTrigger as AddDialogTrigger, DialogDescription as AddDialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface RenderNodeProps {
  node: CatalogHierarchyNode;
  onAddEntry: (parent_id: string | null, type: CatalogEntryType) => void;
  onEditEntry: (entry: CatalogHierarchyNode) => void;
  onDeleteEntry: (entry: CatalogHierarchyNode) => void;
  level: number;
}

function CatalogNodeDisplay({ node, onAddEntry, onEditEntry, onDeleteEntry, level }: RenderNodeProps) {
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
    onAddEntry(node.id, addFormType); 
  };

  return (
    <AccordionItem value={node.id} key={node.id} className="mb-2 border rounded-md shadow-sm bg-background">
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <span className="font-medium">{node.name}</span>
            {node.type === "item" && node.price !== undefined && (
              <span className="ml-2 text-sm text-muted-foreground">${Number(node.price).toFixed(2)}</span>
            )}
            {node.type === "item" && node.has_color_identifier && (
                <span className="ml-2 text-xs text-blue-500">(Color ID)</span>
            )}
            {node.type === 'item' && node.small_tags_to_print !== undefined && node.small_tags_to_print > 0 && (
                <span className="ml-2 text-xs text-purple-600 flex items-center">
                    <Tag className="mr-1 h-3 w-3" />
                    {node.small_tags_to_print} {node.small_tags_to_print === 1 ? 'stub' : 'stubs'}
                </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <span
                onClick={(e) => { e.stopPropagation(); onEditEntry(node); }}
                className="cursor-pointer p-1 flex items-center justify-center rounded-sm hover:bg-accent"
                role="button"
                tabIndex={0}
                aria-label={`Edit ${node.name}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onEditEntry(node);}}}
              >
                <Edit3 className="h-4 w-4" />
              </span>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <span
                onClick={(e) => { e.stopPropagation(); onDeleteEntry(node); }}
                className="cursor-pointer p-1 flex items-center justify-center rounded-sm hover:bg-destructive/10"
                role="button"
                tabIndex={0}
                aria-label={`Delete ${node.name}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDeleteEntry(node);}}}
              >
                <Trash2 className="h-4 w-4" />
              </span>
            </Button>
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
                  onEditEntry={onEditEntry}
                  onDeleteEntry={onDeleteEntry}
                  level={level + 1}
                />
              ))}
            </Accordion>
          )}
          {node.children?.length === 0 && node.type === 'category' && (
            <p className="text-sm text-muted-foreground italic py-2">This category is empty.</p>
          )}

          {node.type === "category" && (
             <AddDialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
              <AddDialogTrigger asChild>
                <div className="mt-2 flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenAddForm("category")}>
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Add Sub-category
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenAddForm("item")}>
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Add Item/Service
                    </Button>
                </div>
              </AddDialogTrigger>
              <AddDialogContent>
                <AddDialogHeader>
                  <AddDialogTitle>Add New {addFormType === 'category' ? 'Sub-category' : 'Item/Service'} to {node.name}</AddDialogTitle>
                  <AddDialogDescription>
                    Fill in the details for the new catalog entry below.
                  </AddDialogDescription>
                </AddDialogHeader>
                <AddCatalogEntryForm
                  parent_id={node.id} 
                  defaultType={addFormType}
                  onSuccess={handleAddSuccess}
                  submitAction={addCatalogEntryAction}
                />
              </AddDialogContent>
            </AddDialog>
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

  const [entryToEdit, setEntryToEdit] = useState<CatalogHierarchyNode | null>(null);
  const [isEditDialogValidOpen, setIsEditDialogValidOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<CatalogHierarchyNode | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);


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

  const handleAddTopLevelSuccess = () => {
    setIsAddTopLevelFormOpen(false);
    toast({ title: "Success", description: "New top-level category added."});
    fetchCatalog(); 
  };
  
  const handleSubEntryAddedOrUpdated = () => {
    fetchCatalog();
  };

  const handleOpenEditDialog = (entry: CatalogHierarchyNode) => {
    setEntryToEdit(entry);
    setIsEditDialogValidOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEntryToEdit(null);
    setIsEditDialogValidOpen(false);
  };

  const handleEditSuccess = () => {
    handleCloseEditDialog();
    toast({ title: "Success", description: "Catalog entry updated." });
    fetchCatalog();
  };

  const handleOpenDeleteConfirm = (entry: CatalogHierarchyNode) => {
    setEntryToDelete(entry);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    const result = await deleteCatalogEntryAction(entryToDelete.id);
    if (result.success) {
      toast({ title: "Success", description: result.message || "Entry deleted." });
      fetchCatalog();
    } else {
      toast({ title: "Error Deleting", description: result.message || "Could not delete entry.", variant: "destructive" });
    }
    setIsDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };


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
      <AddDialog open={isAddTopLevelFormOpen} onOpenChange={setIsAddTopLevelFormOpen}>
        <AddDialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Top-Level Category
          </Button>
        </AddDialogTrigger>
        <AddDialogContent>
          <AddDialogHeader>
            <AddDialogTitle>Add New Top-Level Category</AddDialogTitle>
             <AddDialogDescription>
                Create a main category to organize your services and items.
             </AddDialogDescription>
          </AddDialogHeader>
          <AddCatalogEntryForm
            parent_id={null} 
            defaultType="category"
            onSuccess={handleAddTopLevelSuccess}
            submitAction={addCatalogEntryAction}
          />
        </AddDialogContent>
      </AddDialog>

      {catalogHierarchy.length === 0 ? (
        <p className="text-muted-foreground">No categories found. Start by adding a top-level category.</p>
      ) : (
        <Accordion type="multiple" className="w-full space-y-1">
          {catalogHierarchy.map(node => (
            <CatalogNodeDisplay 
                key={node.id} 
                node={node} 
                onAddEntry={handleSubEntryAddedOrUpdated} 
                onEditEntry={handleOpenEditDialog}
                onDeleteEntry={handleOpenDeleteConfirm}
                level={0} 
            />
          ))}
        </Accordion>
      )}

      {entryToEdit && (
        <EditCatalogEntryDialog
          entry={entryToEdit}
          isOpen={isEditDialogValidOpen}
          onOpenChange={setIsEditDialogValidOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {entryToDelete && (
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{entryToDelete.name}"?
                {entryToDelete.type === 'category' && ' If this category contains items or sub-categories, deletion might fail unless it is emptied first.'}
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        Drag & drop sorting for categories and items will be implemented in a future update.
      </p>
    </div>
  );
}
