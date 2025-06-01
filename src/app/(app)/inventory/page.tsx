import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockInventory } from '@/lib/data';
import type { InventoryItem } from '@/types';
import { Package, Edit, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function InventoryPage() {
  const inventory: InventoryItem[] = mockInventory;

  const getStockLevel = (item: InventoryItem) => {
    if (!item.lowStockThreshold) return 'normal';
    if (item.quantity <= item.lowStockThreshold) return 'low';
    if (item.quantity <= item.lowStockThreshold * 1.5) return 'medium';
    return 'high';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Inventory Tracking</CardTitle>
          <CardDescription>Manage your supplies and track usage.</CardDescription>
        </div>
        <Link href="/inventory/new">
          <Button>Add New Item</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const stockLevel = getStockLevel(item);
              const progressValue = item.lowStockThreshold ? Math.min((item.quantity / (item.lowStockThreshold * 2)) * 100, 100) : 50;
              
              let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
              let badgeClass = "";
              if (stockLevel === 'low') {
                badgeVariant = 'destructive';
                badgeClass = 'bg-red-100 text-red-700 border-red-300';
              } else if (stockLevel === 'medium') {
                badgeVariant = 'outline';
                 badgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
              } else if (stockLevel === 'high') {
                badgeClass = 'bg-green-100 text-green-700 border-green-300';
              }


              return (
                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium flex items-center">
                    <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                    {item.name}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progressValue} className={cn("w-24 h-2", 
                        stockLevel === 'low' && '[&>div]:bg-destructive',
                        stockLevel === 'medium' && '[&>div]:bg-yellow-400',
                        stockLevel === 'high' && '[&>div]:bg-green-500'
                      )} />
                      {stockLevel === 'low' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                          <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                        </Badge>
                      )}
                       {stockLevel === 'medium' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                         Medium
                        </Badge>
                      )}
                       {stockLevel === 'high' && (
                        <Badge variant={badgeVariant} className={badgeClass}>
                         High
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{inventory.length}</strong> inventory items.
        </div>
      </CardFooter>
    </Card>
  );
}
