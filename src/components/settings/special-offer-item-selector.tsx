
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCatalogHierarchyAction } from "@/app/(auth)/settings/catalog-actions";
import type { CatalogHierarchyNode } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SpecialOfferItemSelectorProps {
  selectedItemIds: string[];
  selectedCategoryIds: string[];
  onItemsChange: (ids: string[]) => void;
  onCategoriesChange: (ids: string[]) => void;
}

// Helper to get unique items, preventing duplicate keys
const getUniqueItems = (nodes: CatalogHierarchyNode[]): CatalogHierarchyNode[] => {
  const allItems: CatalogHierarchyNode[] = [];
  const visitedIds = new Set<string>();

  function recurse(nodesToProcess: CatalogHierarchyNode[]) {
    for (const node of nodesToProcess) {
      if (node.type === "item") {
        if (!visitedIds.has(node.id)) {
          allItems.push(node);
          visitedIds.add(node.id);
        }
      }
      if (node.children && node.children.length > 0) {
        recurse(node.children);
      }
    }
  }

  recurse(nodes);
  return allItems;
};

export function SpecialOfferItemSelector({
  selectedItemIds,
  selectedCategoryIds,
  onItemsChange,
  onCategoriesChange,
}: SpecialOfferItemSelectorProps) {
  const [hierarchy, setHierarchy] = useState<CatalogHierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getCatalogHierarchyAction().then((data) => {
      setHierarchy(data);
      setLoading(false);
    });
  }, []);

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
  
  const allCategories = useMemo(() => getAllCategories(hierarchy), [hierarchy]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return allCategories;
    return allCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allCategories, searchTerm]);

  const itemsFromSelectedCategories = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return getUniqueItems(hierarchy);
    }
    const selectedCategoryNodes = findNodesByIds(hierarchy, selectedCategoryIds);
    return getUniqueItems(selectedCategoryNodes);
  }, [selectedCategoryIds, hierarchy]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return itemsFromSelectedCategories;
    return itemsFromSelectedCategories.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [itemsFromSelectedCategories, searchTerm]);


  const toggleItem = (id: string, currentList: string[], setter: (ids: string[]) => void) => {
    if (currentList.includes(id)) {
      setter(currentList.filter((i) => i !== id));
    } else {
      setter([...currentList, id]);
    }
  };

  if (loading) return <div className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4"/> Loading catalog...</div>;

  return (
    <div className="space-y-4 border rounded-md p-4 bg-slate-50/50">
      <h3 className="font-medium text-sm">Assign to Products</h3>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
            type="search"
            placeholder="Search categories or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
        />
      </div>

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
                  {filteredCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between">
                      <Label htmlFor={`cat-${cat.id}`} className="flex-1 cursor-pointer">{cat.name}</Label>
                      <Switch
                        id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onCheckedChange={() => toggleItem(cat.id, selectedCategoryIds, onCategoriesChange)}
                      />
                    </div>
                  ))}
                  {filteredCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories match your search.</p>}
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
                  {filteredItems.length === 0 && <p className="text-sm text-muted-foreground">No items match your search in the selected categories.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
