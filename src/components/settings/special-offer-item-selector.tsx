"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCatalogHierarchyAction } from "@/app/(auth)/settings/catalog-actions";
import type { CatalogHierarchyNode } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface SpecialOfferItemSelectorProps {
  selectedItemIds: string[];
  selectedCategoryIds: string[];
  onItemsChange: (ids: string[]) => void;
  onCategoriesChange: (ids: string[]) => void;
}

export function SpecialOfferItemSelector({
  selectedItemIds,
  selectedCategoryIds,
  onItemsChange,
  onCategoriesChange,
}: SpecialOfferItemSelectorProps) {
  const [hierarchy, setHierarchy] = useState<CatalogHierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCatalogHierarchyAction().then((data) => {
      setHierarchy(data);
      setLoading(false);
    });
  }, []);

  // Recursively extract all items from a set of nodes
  const getItemsFromNodes = (nodes: CatalogHierarchyNode[]): CatalogHierarchyNode[] => {
    let items: CatalogHierarchyNode[] = [];
    for (const node of nodes) {
      if (node.type === "item") {
        items.push(node);
      }
      if (node.children && node.children.length > 0) {
        items = items.concat(getItemsFromNodes(node.children));
      }
    }
    return items;
  };
  
  // Find category nodes from the hierarchy based on IDs
  const findNodesByIds = (nodes: CatalogHierarchyNode[], ids: string[]): CatalogHierarchyNode[] => {
    let foundNodes: CatalogHierarchyNode[] = [];
    for (const node of nodes) {
      if (ids.includes(node.id)) {
        foundNodes.push(node);
      }
      if (node.children && node.children.length > 0) {
        foundNodes = foundNodes.concat(findNodesByIds(node.children, ids));
      }
    }
    return foundNodes;
  };


  // Recursively extract all categories
  const getAllCategories = (nodes: CatalogHierarchyNode[]): CatalogHierarchyNode[] => {
    let cats: CatalogHierarchyNode[] = [];
    nodes.forEach((node) => {
      if (node.type === "category") {
        cats.push(node);
        if (node.children) cats = [...cats, ...getAllCategories(node.children)];
      }
    });
    return cats;
  };
  
  const filteredItems = useMemo(() => {
    // If no categories are selected, show all items.
    if (selectedCategoryIds.length === 0) {
      return getItemsFromNodes(hierarchy);
    }
    // Find the category nodes that are selected.
    const selectedCategoryNodes = findNodesByIds(hierarchy, selectedCategoryIds);
    // Get all descendant items from those selected category nodes.
    return getItemsFromNodes(selectedCategoryNodes);
  }, [selectedCategoryIds, hierarchy]);


  const toggleItem = (id: string, currentList: string[], setter: (ids: string[]) => void) => {
    if (currentList.includes(id)) {
      setter(currentList.filter((i) => i !== id));
    } else {
      setter([...currentList, id]);
    }
  };

  if (loading) return <div className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4"/> Loading catalog...</div>;

  const allCategories = getAllCategories(hierarchy);

  return (
    <div className="space-y-4 border rounded-md p-4 bg-slate-50/50">
      <h3 className="font-medium text-sm">Assign to Products</h3>
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="garments">Individual Garments</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3">
                Toggle categories to include all items within them.
              </p>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {allCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between">
                      <Label htmlFor={`cat-${cat.id}`} className="flex-1 cursor-pointer">{cat.name}</Label>
                      <Switch
                        id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onCheckedChange={() => toggleItem(cat.id, selectedCategoryIds, onCategoriesChange)}
                      />
                    </div>
                  ))}
                  {allCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories found.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="garments">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3">
                {selectedCategoryIds.length > 0 
                  ? "Showing items from selected categories. Toggle to include them individually."
                  : "Toggle specific items to include them individually."
                }
              </p>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <Label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                        {item.name} <span className="text-xs text-muted-foreground">({item.price ? `£${item.price.toFixed(2)}` : 'N/A'})</span>
                      </Label>
                      <Switch
                        id={`item-${item.id}`}
                        checked={selectedItemIds.includes(item.id)}
                        onCheckedChange={() => toggleItem(item.id, selectedItemIds, onItemsChange)}
                      />
                    </div>
                  ))}
                  {filteredItems.length === 0 && <p className="text-sm text-muted-foreground">No items found in the selected categories.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
