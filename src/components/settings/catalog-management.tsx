
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);


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
  }, [fetchCatalog, refreshTrigger]);

  const handleAddTopLevelSuccess = () => {
    setIsAddTopLevelFormOpen(false);
    toast({ title: "Success", description: "New top-level category added."});
    setRefreshTrigger(prev => prev + 1); 
  };
  
  const handleSubEntryAddedOrUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
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
    setRefreshTrigger(prev => prev + 1);
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
      setRefreshTrigger(prev => prev + 1);
    } else {
      toast({ title: "Error Deleting", description: result.message || "Could not delete entry.", variant: "destructive" });
    }
    setIsDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };

  const processImportData = async (data: any[]) => {
    toast({ title: "Processing file...", description: `Found ${data.length} rows.` });
    
    // Normalize header keys to lowercase
    const normalizedData = data.map(row => {
      const newRow: { [key: string]: any } = {};
      for (const key in row) {
        newRow[key.trim().toLowerCase()] = row[key];
      }
      return newRow;
    });

    const requiredHeaders = ["department", "group", "title", "pricelevel1"];
    const fileHeaders = Object.keys(normalizedData[0] || {});
    const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));

    if (missingHeaders.length > 0) {
      toast({ title: "Invalid File Format", description: `File is missing required columns: ${missingHeaders.join(", ")}.`, variant: "destructive" });
      return;
    }

    try {
        toast({ title: "Indexing existing data...", description: "Please wait." });
        const { data: existingData, error: fetchError } = await supabase.from('catalog_entries').select('id, name, parent_id, type');
        if (fetchError) throw new Error("Could not fetch existing catalog to check for duplicates.");

        const buildCategoryPathMap = (entries: { id: string; name: string; parent_id: string | null; type: string }[]) => {
            const entryMap = new Map(entries.map(e => [e.id, e]));
            const pathMap = new Map<string, string>();
            const getPath = (id: string): string => {
                const entry = entryMap.get(id);
                if (!entry) return '';
                const parentPath = entry.parent_id ? getPath(entry.parent_id) : '';
                return parentPath ? `${parentPath} > ${entry.name.toLowerCase()}` : entry.name.toLowerCase();
            }
            entries.forEach(entry => {
                if (entry.type === 'category') {
                    pathMap.set(getPath(entry.id), entry.id);
                }
            });
            return pathMap;
        };

        const categoryPathMap = buildCategoryPathMap(existingData || []);
        const existingItems = new Set<string>();
        existingData?.forEach(e => {
            if (e.type === 'item') {
                existingItems.add(`${e.parent_id}_${e.name.toLowerCase()}`);
            }
        });

        const newCategories = new Map<string, { name: string; parentPath: string | null; sort_order: number }>();
        const itemsToCreate = [];
        let departmentSortOrder = Math.max(0, ...Array.from(categoryPathMap.keys()).filter(k => !k.includes('>')).map(k => k.length));

        for (const row of normalizedData) {
            const department = row['department']?.trim();
            const group = row['group']?.trim();
            const itemName = row['title']?.trim();
            const price = parseFloat(row['pricelevel1']);
            const showColor = row['showcolo']?.toString().trim().toLowerCase();
            const stubsToPrint = parseInt(row['stubprint']?.toString().trim(), 10);

            if (!department || !group || !itemName || isNaN(price)) continue;

            const departmentPath = department.toLowerCase();
            const groupPath = `${departmentPath} > ${group.toLowerCase()}`;

            if (!categoryPathMap.has(departmentPath) && !newCategories.has(departmentPath)) {
                newCategories.set(departmentPath, { name: department, parentPath: null, sort_order: departmentSortOrder++ });
            }
            if (!categoryPathMap.has(groupPath) && !newCategories.has(groupPath)) {
                newCategories.set(groupPath, { name: group, parentPath: departmentPath, sort_order: 0 }); // sort order within group can be refined
            }

            itemsToCreate.push({
                name: itemName,
                price,
                has_color_identifier: showColor === '1' || showColor === 'true',
                small_tags_to_print: !isNaN(stubsToPrint) ? stubsToPrint : 1,
                parentPath: groupPath,
            });
        }

        if (newCategories.size > 0) {
            toast({ title: "Creating Categories...", description: `Adding ${newCategories.size} new categories.` });
            const orderedNewCategories = Array.from(newCategories.entries()).sort((a, b) => a[0].length - b[0].length);
            for (const [path, cat] of orderedNewCategories) {
                const parentId = cat.parentPath ? categoryPathMap.get(cat.parentPath) : null;
                const { data: created, error } = await supabase.from('catalog_entries').insert({ name: cat.name, parent_id: parentId, type: 'category', sort_order: cat.sort_order }).select('id, name').single();
                if (error) throw new Error(`Failed to create category '${cat.name}': ${error.message}`);
                categoryPathMap.set(path, created.id);
            }
        }

        const finalItemsToInsert = itemsToCreate.map(item => {
            const parentId = categoryPathMap.get(item.parentPath);
            if (!parentId || existingItems.has(`${parentId}_${item.name.toLowerCase()}`)) return null;
            return {
                ...item,
                parent_id: parentId,
                type: 'item' as CatalogEntryType,
            };
        }).filter(Boolean);

        if (finalItemsToInsert.length > 0) {
            toast({ title: "Importing Items...", description: `Creating ${finalItemsToInsert.length} new items.` });
            const { error: itemError } = await supabase.from('catalog_entries').insert(finalItemsToInsert.map(({ parentPath, ...rest }) => rest)); // remove temp parentPath
            if (itemError) throw new Error(`Failed to bulk insert items: ${itemError.message}`);
        }

        toast({ title: "Import Complete", description: `Successfully processed file. Created ${finalItemsToInsert.length} new items.` });
    } catch (error: any) {
        console.error("Error during bulk import:", error);
        toast({ title: "Import Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setRefreshTrigger(p => p + 1);
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
        File Import: Expects columns like 'Department', 'Group', 'Title', 'Pricelevel1', 'Showcolo', and 'Stubprint'. Supports CSV, XLS, and XLSX formats.
      </p>
    </div>
  );
}
