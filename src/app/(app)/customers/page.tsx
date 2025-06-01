
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getMockCustomers } from '@/lib/data';
import type { Customer } from '@/types';
import { Eye, Pencil, MoreHorizontal, Phone, Mail, Star, Tag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function CustomersPage() {
  const customers: Customer[] = getMockCustomers();

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Customer Management</CardTitle>
          <CardDescription>View and manage your customer database.</CardDescription>
        </div>
        <Link href="/customers/new">
          <Button>Add New Customer</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  {customer.phone && <div className="flex items-center text-sm"><Phone className="w-3 h-3 mr-1.5 text-muted-foreground" /> {customer.phone}</div>}
                  {customer.email && <div className="flex items-center text-sm text-muted-foreground"><Mail className="w-3 h-3 mr-1.5" /> {customer.email}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {customer.loyaltyStatus && customer.loyaltyStatus !== "None" && (
                      <Badge variant="secondary" className="flex items-center w-fit">
                        <Star className="w-3 h-3 mr-1" /> {customer.loyaltyStatus}
                      </Badge>
                    )}
                    {customer.priceBand && customer.priceBand !== "Standard" && (
                      <Badge variant="outline" className="flex items-center w-fit">
                        <Tag className="w-3 h-3 mr-1" /> {customer.priceBand}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{format(new Date(customer.createdAt), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                       <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{customers.length}</strong> customers.
        </div>
      </CardFooter>
    </Card>
  );
}
