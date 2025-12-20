
"use client";

import React, { useEffect, useState, use } from 'react';
import { getOrderByIdDb } from '@/lib/data';
import type { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ArrowLeft, Edit, Printer, PoundSterling, CalendarDays, User, ListOrdered, 
  Hash, CreditCard, ShieldCheck, ShieldAlert, Zap, Percent, CheckCircle, Banknote, WalletCards 
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateOrderStatusAction } from "../actions"; // Import the status update action
import { recordPaymentAction } from "../payment-actions"; // Import the payment action

// ... (Keep existing helper functions and constants like statusColors, etc.) ...
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
    case 'Partially Paid': return 'secondary'; // Handle the new status
    default: return 'outline';
  }
}

const paymentStatusColors: Record<string, string> = {
  Paid: "bg-green-100 text-green-700 border-green-300",
  Unpaid: "bg-red-100 text-red-700 border-red-300",
  "Partially Paid": "bg-orange-100 text-orange-700 border-orange-300",
  "Processing Payment": "bg-yellow-100 text-yellow-700 border-yellow-300",
  Refunded: "bg-gray-100 text-gray-700 border-gray-300",
};

const paymentStatusIcons: Record<string, React.ElementType> = {
  Paid: ShieldCheck,
  Unpaid: ShieldAlert,
  "Partially Paid": ShieldAlert,
  "Processing Payment": CreditCard,
  Refunded: PoundSterling,
}

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params: paramsPromise }: OrderDetailsPageProps) {
  const params = use(paramsPromise);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Collection State
  const [isCollecting, setIsCollecting] = useState(false);

  const effectiveIsExpress = order?.isExpress || searchParams.get('express') === 'true';
  const [isVatEnabled, setIsVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState(0.20);

  useEffect(() => {
    async function fetchOrder() {
      if (!params.id) {
        setError("Order ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fetchedOrder = await getOrderByIdDb(params.id);
        if (!fetchedOrder) {
            setOrder(null);
            setError("Order not found.");
        } else {
            setOrder(fetchedOrder);
            // Default payment amount to remaining balance
            const remaining = fetchedOrder.totalAmount - (fetchedOrder.amount_paid || 0);
            setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : "0.00");
        }
      } catch (err: any) {
        console.error("Failed to fetch order:", err);
        setError("Failed to load order details.");
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  useEffect(() => {
    if (!order) return;
    const autoprint = searchParams.get('autoprint');
    if (autoprint === 'true') {
      const printTimeout = setTimeout(() => window.print(), 100);
      return () => clearTimeout(printTimeout);
    }
  }, [searchParams, order]);

  // --- Handlers ---

  const handlePrint = (printType: string = "default") => {
    const queryParams = `?autoprint=true&printType=${printType}${effectiveIsExpress ? '&express=true' : ''}`;
    router.push(`/orders/${params.id}${queryParams}`);
  };

  const handleCollectOrder = async () => {
    if (!order) return;
    setIsCollecting(true);
    const result = await updateOrderStatusAction(order.id, 'Completed');
    
    if (result.success) {
      toast({ title: "Order Collected", description: "Order marked as completed." });
      setOrder(prev => prev ? { ...prev, status: 'Completed' } : prev);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsCollecting(false);
  };

  const handlePayOrder = async () => {
    if (!order || !paymentMethod) return;
    setIsProcessingPayment(true);

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const result = await recordPaymentAction(order.id, amount, paymentMethod);

    if (result.success) {
      toast({ title: "Payment Recorded", description: `Successfully paid £${amount.toFixed(2)}` });
      
      // Update local state to reflect payment immediately
      const newPaid = (order.amount_paid || 0) + amount;
      const newStatus = newPaid >= order.totalAmount ? 'Paid' : 'Partially Paid';
      
      setOrder(prev => prev ? { 
        ...prev, 
        amount_paid: newPaid, 
        paymentStatus: newStatus as PaymentStatus,
        status: newStatus === 'Paid' ? 'Ready for Pickup' : prev.status
      } : prev);
      
      setIsPaymentModalOpen(false);
    } else {
      toast({ title: "Payment Failed", description: result.message, variant: "destructive" });
    }
    setIsProcessingPayment(false);
  };


  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-9 w-32" /><Card className="shadow-lg"><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card></div>;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <CardTitle className="text-2xl mb-4">{error || "Order Not Found"}</CardTitle>
          <Link href="/orders"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders</Button></Link>
        </Card>
      </div>
    );
  }

  const PaymentIcon = order.paymentStatus ? (paymentStatusIcons[order.paymentStatus] || ShieldAlert) : ShieldAlert;
  const isPaid = order.paymentStatus === 'Paid';
  const remainingBalance = Math.max(0, order.totalAmount - (order.amount_paid || 0));

  const subTotal = order.totalAmount; // Simplified for display
  const grandTotal = subTotal; // Assuming VAT included in total for simple display logic

  return (
    <div id="orderDetailsPrintSection" className="space-y-6 pb-20">
      
      {/* --- Top Bar --- */}
      <div className="flex items-center justify-between print-hidden">
        <Link href="/orders">
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
        </Link>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePrint('customer_copy')}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            
            {/* ACTION BUTTONS */}
            {isPaid ? (
               order.status !== 'Completed' ? (
                 <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCollectOrder} disabled={isCollecting}>
                    <CheckCircle className="mr-2 h-4 w-4" /> {isCollecting ? "Marking..." : "Collect Order"}
                 </Button>
               ) : (
                 <Button variant="secondary" disabled><CheckCircle className="mr-2 h-4 w-4" /> Collected</Button>
               )
            ) : (
               <Button onClick={() => setIsPaymentModalOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" /> Pay Order
               </Button>
            )}
        </div>
      </div>

      {/* --- Main Info Card --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center">
                Order {order.orderNumber}
                {effectiveIsExpress && <Badge variant="destructive" className="ml-2 text-sm px-2 py-0.5"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}
              </CardTitle>
              <CardDescription>
                Placed on {order.created_at ? format(new Date(order.created_at), 'MMMM dd, yyyy') : 'N/A'}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusBadgeVariant(order.status)} className={`${statusColors[order.status]} text-sm px-3 py-1`}>
                {order.status}
              </Badge>
              {order.paymentStatus && (
                <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className={`${paymentStatusColors[order.paymentStatus] || 'bg-gray-100'} text-xs px-2 py-0.5`}>
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
            <h4 className="text-sm font-medium flex items-center text-muted-foreground"><PoundSterling className="mr-2 h-4 w-4" /> Balance Due</h4>
            <p className={`text-base font-semibold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                £{remainingBalance.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- Items Table --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ListOrdered className="mr-2 h-5 w-5"/>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: OrderItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.serviceName}</div>
                    {item.color_value && item.has_color_identifier && <div className="text-xs text-muted-foreground">Color: {item.color_value}</div>}
                    {item.notes && <div className="text-xs text-muted-foreground">Notes: {item.notes}</div>}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>£{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">£{item.totalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableBody>
                <TableRow className="border-t-2 border-foreground bg-muted/20">
                  <TableCell colSpan={3} className="text-right text-lg font-bold">Grand Total:</TableCell>
                  <TableCell className="text-right text-lg font-bold">£{grandTotal.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow className="">
                  <TableCell colSpan={3} className="text-right text-sm text-muted-foreground">Amount Paid:</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">- £{order.amount_paid?.toFixed(2) || "0.00"}</TableCell>
                </TableRow>
                 <TableRow className="">
                  <TableCell colSpan={3} className="text-right text-md font-semibold text-primary">To Pay:</TableCell>
                  <TableCell className="text-right text-md font-semibold text-primary">£{remainingBalance.toFixed(2)}</TableCell>
                </TableRow>
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

      {/* --- Payment Modal --- */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Take Payment</DialogTitle>
                <DialogDescription>
                    Enter the amount being paid now.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                    <span className="text-sm font-medium">Outstanding Balance:</span>
                    <span className="text-lg font-bold text-red-600">£{remainingBalance.toFixed(2)}</span>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">£</span>
                        <Input 
                            type="number" 
                            className="pl-7 text-lg font-semibold" 
                            value={paymentAmount} 
                            onChange={(e) => setPaymentAmount(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                        variant={paymentMethod === 'Cash' ? 'default' : 'outline'} 
                        className="h-12" 
                        onClick={() => setPaymentMethod('Cash')}
                    >
                        <Banknote className="mr-2 h-5 w-5"/> Cash
                    </Button>
                    <Button 
                        variant={paymentMethod === 'Card' ? 'default' : 'outline'} 
                        className="h-12"
                        onClick={() => setPaymentMethod('Card')}
                    >
                        <WalletCards className="mr-2 h-5 w-5"/> Card
                    </Button>
                </div>
            </div>
            <DialogFooter className="sm:justify-between gap-2">
                <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    disabled={!paymentMethod || isProcessingPayment} 
                    onClick={handlePayOrder}
                >
                    {isProcessingPayment ? "Processing..." : `Confirm Payment`}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
