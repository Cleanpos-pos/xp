
"use client";

import React, { useEffect } from 'react'; 
import { getOrderById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, Printer, DollarSign, CalendarDays, User, ListOrdered, Hash, CreditCard, ShieldCheck, ShieldAlert, Zap } from 'lucide-react';
import type { OrderItem, OrderStatus, PaymentStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';

function getStatusBadgeVariant(status: OrderStatus): "default" | "secondary" | "destructive" | "outline" {
   switch (status) {
    case 'Completed': return 'default';
    case 'Ready for Pickup': return 'secondary';
    case 'Cleaning': case 'Alterations': case 'Processing': return 'outline';
    case 'Received': return 'outline';
    case 'Cancelled': return 'destructive';
    default: return 'outline';
  }
}

const statusColors: Record<OrderStatus, string> = {
  Received: "bg-blue-100 text-blue-700 border-blue-300",
  Processing: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Cleaning: "bg-indigo-100 text-indigo-700 border-indigo-300",
  Alterations: "bg-purple-100 text-purple-700 border-purple-300",
  "Ready for Pickup": "bg-green-100 text-green-700 border-green-300",
  Completed: "bg-gray-200 text-gray-800 border-gray-400",
  Cancelled: "bg-red-100 text-red-700 border-red-300",
};

function getPaymentStatusBadgeVariant(status?: PaymentStatus): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  switch (status) {
    case 'Paid': return 'default'; 
    case 'Unpaid': return 'destructive';
    case 'Processing Payment': return 'secondary';
    case 'Refunded': return 'outline';
    default: return 'outline';
  }
}

const paymentStatusColors: Record<PaymentStatus, string> = {
  Paid: "bg-green-100 text-green-700 border-green-300",
  Unpaid: "bg-red-100 text-red-700 border-red-300",
  "Processing Payment": "bg-yellow-100 text-yellow-700 border-yellow-300",
  Refunded: "bg-gray-100 text-gray-700 border-gray-300",
};

const paymentStatusIcons: Record<PaymentStatus, React.ElementType> = {
  Paid: ShieldCheck,
  Unpaid: ShieldAlert,
  "Processing Payment": CreditCard,
  Refunded: DollarSign, 
}


export default function OrderDetailsPage({ params: paramsPromise }: { params: { id: string } }) {
  const params = React.use(paramsPromise as unknown as Promise<{ id: string }>);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const order = getOrderById(params.id); 
  const isExpressFromQuery = searchParams.get('express') === 'true';
  const effectiveIsExpress = order?.isExpress || isExpressFromQuery;


  useEffect(() => {
    const autoprint = searchParams.get('autoprint');
    const printTypeParam = searchParams.get('printType');

    if (autoprint === 'true') {
      console.log("Attempting to print for type:", printTypeParam); 
      // Here you could add logic to modify the page *before* printing
      // based on printTypeParam, e.g., by adding a class to the body
      // document.body.classList.add(`print-type-${printTypeParam}`);
      // For now, it just triggers a generic print.
      
      const printTimeout = setTimeout(() => {
        window.print();
        // Optional: remove the class after printing
        // if (printTypeParam) document.body.classList.remove(`print-type-${printTypeParam}`);
        
        // Navigate back to a cleaner URL without autoprint params
        // Or, navigate to wherever is appropriate after printing
        // router.replace(`/orders/${params.id}${effectiveIsExpress ? '?express=true' : ''}`);
      }, 100); // Timeout to allow content to render fully
      return () => clearTimeout(printTimeout);
    }
  }, [searchParams, params.id, router, effectiveIsExpress]); // Added effectiveIsExpress to dep array


  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The order you are looking for does not exist or could not be found.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/orders">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const PaymentIcon = order.paymentStatus ? paymentStatusIcons[order.paymentStatus] : ShieldAlert;

  const handlePrint = (printType: string = "default") => {
    // This function could also set up print-specific state or classes before calling window.print()
    // For now, it's simple, but it's a good place for future enhancements.
    const queryParams = `?autoprint=true&printType=${printType}${effectiveIsExpress ? '&express=true' : ''}`;
    // Re-navigate with print params to trigger the useEffect print logic
    router.push(`/orders/${order.id}${queryParams}`);
  };

  return (
    <div id="orderDetailsPrintSection" className="space-y-6">
      <div className="flex items-center justify-between print-hidden">
        <Link href="/orders">
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
        </Link>
        <div className="flex gap-2">
            <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit Order</Button>
            <Button variant="outline" size="sm" onClick={() => handlePrint('customer_copy')}><Printer className="mr-2 h-4 w-4" /> Print Customer Copy</Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center">
                Order {order.orderNumber}
                {effectiveIsExpress && <Badge variant="destructive" className="ml-2 text-sm px-2 py-0.5"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}
              </CardTitle>
              <CardDescription>
                Details for order placed on {order.created_at ? format(new Date(order.created_at), 'MMMM dd, yyyy') : 'N/A'}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusBadgeVariant(order.status)} className={`${statusColors[order.status]} text-sm px-3 py-1`}>
                {order.status}
              </Badge>
              {order.paymentStatus && (
                <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className={`${paymentStatusColors[order.paymentStatus]} text-xs px-2 py-0.5`}>
                   <PaymentIcon className="mr-1 h-3 w-3" />
                  {order.paymentStatus}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-medium flex items-center text-muted-foreground"><User className="mr-2 h-4 w-4" /> Customer</h4>
            <p className="text-base">{order.customerName}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium flex items-center text-muted-foreground"><CalendarDays className="mr-2 h-4 w-4" /> Due Date</h4>
            <p className="text-base">{order.dueDate ? format(new Date(order.dueDate), 'MMMM dd, yyyy') : 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium flex items-center text-muted-foreground"><DollarSign className="mr-2 h-4 w-4" /> Total Amount</h4>
            <p className="text-base font-semibold">${order.totalAmount.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ListOrdered className="mr-2 h-5 w-5"/>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: OrderItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.serviceName}</div>
                    {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {order.notes && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Hash className="mr-2 h-5 w-5"/>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
