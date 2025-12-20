
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusCircle, Edit3, Trash2, Tag, Upload } from "lucide-react";
import type { CatalogHierarchyNode, CatalogEntry, CatalogEntryType } from "@/types";
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
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

interface RenderNodeProps {
  node: CatalogHierarchyNode;
  onAddEntry: () => void;
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
    onAddEntry(); // Call the passed-in refresh function
  };

  return (
    <AccordionItem value={node.id} key={node.id} className="mb-2 border rounded-md shadow-sm bg-background">
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <span className="font-medium">{node.name}</span>
            {node.type === "item" && node.price !== undefined && (
              <span className="ml-2 text-sm text-muted-foreground">£{Number(node.price).toFixed(2)}</span>
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entryToEdit, setEntryToEdit] = useState<CatalogHierarchyNode | null>(null);
  const [isEditDialogValidOpen, setIsEditDialogValidOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<CatalogHierarchyNode | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);


  const fetchCatalog = useCallback(async () => {
    // No need to set isLoading(true) here if we want a silent refresh
    try {
      const hierarchy = await getCatalogHierarchyAction();
      setCatalogHierarchy(hierarchy);
    } catch (error) {
      console.error("Failed to fetch catalog:", error);
      toast({ title: "Error", description: "Could not load catalog data.", variant: "destructive" });
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true);
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

  const processImportData = async (data: any[]) => {
    console.log("Parsed Data to Process:", data);
    toast({ title: "Pre-processing file...", description: `Found ${data.length} rows.` });

    const requiredHeaders = ["menu1", "title", "pricelevel1"];
    const fileHeaders = Object.keys(data[0] || {}).map(h => h.trim().toLowerCase());
    const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));

    if (missingHeaders.length > 0) {
      toast({ title: "Invalid File Format", description: `File is missing columns: ${missingHeaders.join(", ")}.`, variant: "destructive" });
      return;
    }

    try {
      // Step 1: Pre-process all data to find unique categories to create
      const categoriesToCreate = new Map<string, { name: string; parentId: string | null }>();
      const existingCategories = new Map<string, string>();
      catalogHierarchy.forEach(node => {
          if (node.type === 'category') existingCategories.set(node.name.toLowerCase(), node.id);
      });

      data.forEach(row => {
        const categoryName = row['Menu1']?.trim();
        if (categoryName && !existingCategories.has(categoryName.toLowerCase()) && !categoriesToCreate.has(categoryName.toLowerCase())) {
          categoriesToCreate.set(categoryName.toLowerCase(), { name: categoryName, parentId: null });
        }
      });

      // Step 2: Bulk insert new categories
      const newCategoryInserts = Array.from(categoriesToCreate.values()).map(cat => ({
        name: cat.name,
        parent_id: cat.parentId,
        type: 'category' as CatalogEntryType,
        sort_order: 0, // Simplified sort_order for bulk insert
      }));

      if (newCategoryInserts.length > 0) {
        toast({ title: "Importing...", description: `Creating ${newCategoryInserts.length} new categories...` });
        const { data: newCategories, error: catError } = await supabase
          .from('catalog_entries')
          .insert(newCategoryInserts)
          .select('id, name');

        if (catError) throw new Error(`Failed to bulk insert categories: ${catError.message}`);
        
        newCategories?.forEach(nc => existingCategories.set(nc.name.toLowerCase(), nc.id));
      }

      // Step 3: Prepare all items for bulk insert
      const itemsToInsert = data
        .map(row => {
          const categoryName = row['Menu1']?.trim();
          const itemName = row['Title']?.trim();
          const price = parseFloat(row['Pricelevel1']);

          if (!itemName || isNaN(price)) return null;

          const parentId = categoryName ? existingCategories.get(categoryName.toLowerCase()) || null : null;

          return {
            name: itemName,
            parent_id: parentId,
            type: 'item' as CatalogEntryType,
            price: price,
            sort_order: 0,
          };
        })
        .filter(Boolean);

      // Step 4: Bulk insert new items
      if (itemsToInsert.length > 0) {
        toast({ title: "Importing...", description: `Creating ${itemsToInsert.length} new items...` });
        const { error: itemError } = await supabase.from('catalog_entries').insert(itemsToInsert as any);
        if (itemError) throw new Error(`Failed to bulk insert items: ${itemError.message}`);
      }

      toast({
        title: "Import Complete",
        description: `Successfully processed ${itemsToInsert.length} items and ${newCategoryInserts.length} new categories. Refreshing catalog...`,
      });

    } catch (error: any) {
      console.error("Error during bulk import process:", error);
      toast({ title: "Import Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      await fetchCatalog();
    }
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processImportData(results.data),
        error: (error) => toast({ title: "CSV Parsing Error", description: error.message, variant: "destructive" }),
      });
    } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          processImportData(json);
        } catch (error: any) {
          toast({ title: "Excel Parsing Error", description: error.message, variant: "destructive" });
        }
      };
      reader.onerror = (error) => {
        toast({ title: "File Reading Error", description: "Could not read the selected file.", variant: "destructive" });
      };
      reader.readAsBinaryString(file);
    } else {
      toast({ title: "Unsupported File Type", description: "Please upload a CSV, XLS, or XLSX file.", variant: "destructive" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      <div className="flex flex-wrap gap-2">
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
        
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Import from File
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv,.xls,.xlsx"
          className="hidden"
        />
      </div>


      {catalogHierarchy.length === 0 ? (
        <p className="text-muted-foreground mt-4">No categories found. Start by adding a top-level category or importing a file.</p>
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
        File Import: Expects columns 'Menu1' (Category), 'Title' (Item Name), and 'Pricelevel1' (Price). Supports CSV, XLS, and XLSX formats.
      </p>
    </div>
  );
}
