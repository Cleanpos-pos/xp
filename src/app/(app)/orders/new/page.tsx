
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getCustomers, getCustomerById, getServices } from "@/lib/data"; // Updated: getServices
import type { ServiceItem, Customer } from "@/types";
import { CreateOrderSchema, type CreateOrderInput, type OrderItemInput } from "./order.schema";
import { createOrderAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock, CreditCard, ArrowRight, Archive, Grid, Banknote, WalletCards, Printer, Zap, PlusCircle, MinusCircle, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, addDays, isToday, isTomorrow, getDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AlphanumericKeypadModal } from "@/components/ui/alphanumeric-keypad-modal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";


interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderCreationStage = "form" | "paymentOptions";
type PaymentStep = "selectAction" | "enterPaymentDetails";
type PaymentMethod = "Cash" | "Card" | "On Account" | null;

const getNextOccurrenceOfWeekday = (targetDay: number, startDate: Date = new Date()): Date => {
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const currentDay = getDay(currentDate);
  let daysToAdd = (targetDay - currentDay + 7) % 7;
  if (daysToAdd === 0 && currentDate.getTime() !== new Date(new Date().setHours(0,0,0,0)).getTime() && currentDay === targetDay) {
      // Only advance if it's the target day but not today, for next week's occurrence.
  }
  const resultDate = addDays(currentDate, daysToAdd);
  return resultDate;
};


export default function NewOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = React.useState<OrderCreationStage>("form");
  const [createdOrderDetails, setCreatedOrderDetails] = React.useState<{ id: string; message: string; totalAmount: number; isExpress?: boolean } | null>(null);

  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [isLoadingAllCustomers, setIsLoadingAllCustomers] = React.useState(false);
  const [isLoadingSpecificCustomer, setIsLoadingSpecificCustomer] = React.useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = React.useState<string | null>(null);

  const [allServices, setAllServices] = React.useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [servicesByCategory, setServicesByCategory] = React.useState<ServicesByCategory>({});
  const [serviceCategoryNames, setServiceCategoryNames] = React.useState<string[]>([]);

  const [activePaymentStep, setActivePaymentStep] = React.useState<PaymentStep>("selectAction");
  const [amountTendered, setAmountTendered] = React.useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>(null);
  const [isKeypadOpen, setIsKeypadOpen] = React.useState(false);
  const [paymentNote, setPaymentNote] = React.useState<string>("");

  const [showPrintDialog, setShowPrintDialog] = React.useState(false);
  const [printType, setPrintType] = React.useState<string | null>(null);

  const [isExpressOrder, setIsExpressOrder] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customerId: "",
      items: [],
      dueDate: undefined,
      notes: "",
      isExpress: false,
      cartDiscountAmount: undefined,
      cartDiscountPercentage: undefined,
      cartPriceOverride: undefined,
    },
  });

  const customerIdFromQueryRaw = searchParams.get('customerId');
  const customerIdFromQuery = customerIdFromQueryRaw?.trim();

  React.useEffect(() => {
    if (!customerIdFromQuery) {
      setIsLoadingAllCustomers(true);
      getCustomers().then(setAllCustomers).catch(err => console.error("[NewOrderPage] Failed to fetch customers:", err)).finally(() => setIsLoadingAllCustomers(false));
    } else {
      setAllCustomers([]);
      setIsLoadingAllCustomers(false);
    }
  }, [customerIdFromQuery]);

  React.useEffect(() => {
    if (customerIdFromQuery) {
      setIsLoadingSpecificCustomer(true);
      setSelectedCustomerName(null);
      form.setValue('customerId', '');
      getCustomerById(customerIdFromQuery).then(customer => {
        if (customer) {
          form.setValue('customerId', customer.id, { shouldValidate: true });
          setSelectedCustomerName(customer.name);
        } else {
          toast({ title: "Customer Not Loaded", description: `Failed to load customer (ID: ${customerIdFromQuery}). Select manually.`, variant: "warning" });
        }
      }).catch(err => {
        console.error("[NewOrderPage] Error fetching pre-selected customer by ID:", err);
        toast({ title: "Error Loading Customer by ID", description: `Could not load details for pre-selected customer (ID: '${customerIdFromQuery}').`, variant: "destructive" });
      }).finally(() => setIsLoadingSpecificCustomer(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdFromQuery, toast]);
  
  const watchedCustomerId = form.watch("customerId");

  React.useEffect(() => {
    if (isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !customerIdFromQuery)) return;
    if (watchedCustomerId) {
      const customer = allCustomers.find(c => c.id === watchedCustomerId);
      if (customer) setSelectedCustomerName(customer.name);
      else if (!customerIdFromQuery) setSelectedCustomerName(null);
    } else if (!customerIdFromQuery) setSelectedCustomerName(null);
  }, [watchedCustomerId, allCustomers, customerIdFromQuery, isLoadingAllCustomers, isLoadingSpecificCustomer]);

  React.useEffect(() => {
    async function fetchServicesData() { // Renamed from fetchServices to avoid conflict
      setIsLoadingServices(true);
      try {
        const servicesData = await getServices(); // Using renamed getServices
        setAllServices(servicesData);
        const groupedServices = servicesData.reduce((acc, service) => {
          const category = service.category || "Other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(service);
          return acc;
        }, {} as ServicesByCategory);
        setServicesByCategory(groupedServices);
        setServiceCategoryNames(Object.keys(groupedServices));
      } catch (err) {
        console.error("[NewOrderPage] Failed to fetch services:", err);
        toast({ title: "Error", description: "Could not load services list.", variant: "destructive" });
      } finally {
        setIsLoadingServices(false);
      }
    }
    fetchServicesData();
  }, [toast]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleServiceItemClick = (service: ServiceItem) => {
    const currentItems = form.getValues("items");
    const existingItemIndex = currentItems.findIndex(item => item.serviceItemId === service.id);
    if (existingItemIndex > -1) {
      update(existingItemIndex, { ...currentItems[existingItemIndex], quantity: currentItems[existingItemIndex].quantity + 1 });
    } else {
      append({
        serviceItemId: service.id,
        serviceName: service.name,
        originalUnitPrice: service.price,
        unitPrice: service.price,
        quantity: 1,
        notes: "",
        itemDiscountAmount: undefined,
        itemDiscountPercentage: undefined,
        has_color_identifier: service.has_color_identifier, // Pass this from service
        color_value: "", // Default color value
      });
    }
  };

  const watchedItems = form.watch("items");
  const watchedCartDiscountAmount = form.watch("cartDiscountAmount");
  const watchedCartDiscountPercentage = form.watch("cartDiscountPercentage");
  const watchedCartPriceOverride = form.watch("cartPriceOverride");

  const calculatedTotals = React.useMemo(() => {
    let subtotal = 0;
    watchedItems.forEach(item => {
      let itemPrice = item.unitPrice * item.quantity;
      if (item.itemDiscountPercentage && item.itemDiscountPercentage > 0) {
        itemPrice -= itemPrice * (item.itemDiscountPercentage / 100);
      }
      if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
        itemPrice -= item.itemDiscountAmount;
      }
      subtotal += Math.max(0, itemPrice); // Ensure item price doesn't go below zero
    });

    let totalAfterCartDiscounts = subtotal;
    if (watchedCartDiscountPercentage && watchedCartDiscountPercentage > 0) {
      totalAfterCartDiscounts -= totalAfterCartDiscounts * (watchedCartDiscountPercentage / 100);
    }
    if (watchedCartDiscountAmount && watchedCartDiscountAmount > 0) {
      totalAfterCartDiscounts -= watchedCartDiscountAmount;
    }
    totalAfterCartDiscounts = Math.max(0, totalAfterCartDiscounts);

    const grandTotal = (watchedCartPriceOverride !== undefined && watchedCartPriceOverride >= 0)
      ? watchedCartPriceOverride
      : totalAfterCartDiscounts;

    return { subtotal, grandTotal };
  }, [watchedItems, watchedCartDiscountAmount, watchedCartDiscountPercentage, watchedCartPriceOverride]);


  const resetFormAndStage = React.useCallback(() => {
    form.reset({ customerId: "", items: [], dueDate: undefined, notes: "", isExpress: false, cartDiscountAmount: undefined, cartDiscountPercentage: undefined, cartPriceOverride: undefined });
    setStage("form"); setCreatedOrderDetails(null); setActivePaymentStep("selectAction"); setAmountTendered(""); setSelectedPaymentMethod(null); setIsKeypadOpen(false); setPaymentNote(""); setShowPrintDialog(false); setPrintType(null); setIsExpressOrder(false); setIsDatePickerOpen(false);
    if (!searchParams.get('customerId')) { setSelectedCustomerName(null); setIsLoadingAllCustomers(true); getCustomers().then(setAllCustomers).finally(() => setIsLoadingAllCustomers(false)); }
  }, [form, searchParams]);

  async function proceedToPaymentSubmit(data: CreateOrderInput) {
    const submissionData = { ...data, isExpress: isExpressOrder };
    const result = await createOrderAction(submissionData);
    if (result.success && result.orderId) {
      toast({ title: "Order Created", description: result.message });
      setCreatedOrderDetails({ id: result.orderId, message: result.message || "Order created!", totalAmount: calculatedTotals.grandTotal, isExpress: isExpressOrder });
      setStage("paymentOptions"); setActivePaymentStep("selectAction"); setAmountTendered(calculatedTotals.grandTotal > 0 ? calculatedTotals.grandTotal.toFixed(2) : "0.00"); setSelectedPaymentMethod(null); setPaymentNote("");
    } else {
      toast({ title: "Error Creating Order", description: result.errors ? JSON.stringify(result.errors) : (result.message || "Failed to create order."), variant: "destructive" });
    }
  }

  async function handleCreateAndPayLater() {
    const isValid = await form.trigger(); if (!isValid) { toast({ title: "Validation Error", description: "Please check form errors.", variant: "destructive" }); return; }
    if (fields.length === 0) { form.setError("items", { type: "manual", message: "Order must have at least one item." }); toast({ title: "Validation Error", description: "Order must have at least one item.", variant: "destructive" }); return; }
    const data = form.getValues(); const submissionData = { ...data, isExpress: isExpressOrder }; const result = await createOrderAction(submissionData);
    if (result.success && result.orderId) {
      toast({ title: "Order Created (Pay Later)", description: result.message });
      setCreatedOrderDetails({ id: result.orderId, message: result.message || "Order created!", totalAmount: calculatedTotals.grandTotal, isExpress: isExpressOrder });
      setPrintType(null); setShowPrintDialog(true);
    } else {
      toast({ title: "Error Creating Order", description: result.errors ? JSON.stringify(result.errors) : (result.message || "Failed to create order."), variant: "destructive" });
    }
  }

  const handleConfirmPayment = () => {
    if (!createdOrderDetails) return; let paymentDetailsMessage = ""; const numericTotalAmount = createdOrderDetails.totalAmount; const numericAmountTendered = parseFloat(amountTendered) || 0;
    if (selectedPaymentMethod === "On Account") { paymentDetailsMessage = `Order ${createdOrderDetails.id} ($${numericTotalAmount.toFixed(2)}) marked 'On Account'.`; if(paymentNote) paymentDetailsMessage += ` Note: ${paymentNote}`; }
    else if (selectedPaymentMethod === "Cash" || selectedPaymentMethod === "Card") { const paymentType = selectedPaymentMethod; let paymentSummary = `Paid ${numericAmountTendered.toFixed(2)} by ${paymentType}.`; if (numericAmountTendered < numericTotalAmount) paymentSummary += ` (Partial - $${(numericTotalAmount - numericAmountTendered).toFixed(2)} remaining).`; else if (numericAmountTendered > numericTotalAmount && selectedPaymentMethod === "Cash") paymentSummary += ` Change: $${(numericAmountTendered - numericTotalAmount).toFixed(2)}.`; paymentDetailsMessage = `Payment for order ${createdOrderDetails.id}: ${paymentSummary}`; if(paymentNote) paymentDetailsMessage += ` Note: ${paymentNote}`; }
    else { paymentDetailsMessage = `Order ${createdOrderDetails.id} processed.`; if(paymentNote) paymentDetailsMessage += ` Note: ${paymentNote}`; }
    toast({ title: "Payment Processed (Mocked)", description: paymentDetailsMessage }); setPrintType(null); setShowPrintDialog(true);
  };

  const handlePrintSelection = (selectedType: string) => {
    setPrintType(selectedType); setShowPrintDialog(false);
    if (createdOrderDetails) { const queryParams = `?autoprint=true&printType=${selectedType}${createdOrderDetails.isExpress ? '&express=true' : ''}`; router.push(`/orders/${createdOrderDetails.id}${queryParams}`); resetFormAndStage(); }
  };

  const handlePayLaterAndNav = () => { if (!createdOrderDetails) return; const queryParams = createdOrderDetails.isExpress ? '?express=true' : ''; router.push(`/orders/${createdOrderDetails.id}${queryParams}`); resetFormAndStage(); };
  const handleCreateAnotherOrder = () => { resetFormAndStage(); router.push('/find-or-add-customer'); };
  const handleGoToDashboard = () => router.push('/dashboard');
  const handleAmountKeypadConfirm = (value: string) => { const numValue = parseFloat(value); if (isNaN(numValue) || numValue < 0) { setAmountTendered(createdOrderDetails?.totalAmount.toFixed(2) || "0.00"); toast({title: "Invalid Amount", variant: "destructive"}); } else { setAmountTendered(numValue.toFixed(2)); } };
  const handlePayOnAccount = () => { setSelectedPaymentMethod("On Account"); if (createdOrderDetails) { setAmountTendered(createdOrderDetails.totalAmount.toFixed(2)); setPaymentNote(`Order total $${createdOrderDetails.totalAmount.toFixed(2)} to account.`); } };
  const handleOpenAmountKeypad = React.useCallback(() => { if (selectedPaymentMethod !== "On Account") setIsKeypadOpen(true); }, [selectedPaymentMethod]);
  const handleDueDateButtonClick = (date: Date) => { form.setValue('dueDate', date, { shouldValidate: true }); setIsExpressOrder(isToday(date) || isTomorrow(date)); };
  const handleManualDateSelect = (date: Date | undefined) => { form.setValue('dueDate', date, { shouldValidate: true }); if (date) setIsExpressOrder(isToday(date) || isTomorrow(date)); else setIsExpressOrder(false); setIsDatePickerOpen(false); };
  const clearDueDate = () => { form.setValue('dueDate', undefined, { shouldValidate: true }); setIsExpressOrder(false); };
  const watchedDueDate = form.watch("dueDate"); const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderOrderFormCard = () => (
    <Card className="shadow-lg sticky top-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center"><ShoppingCart className="mr-2 h-6 w-6" /> Current Order</CardTitle>
        {fields.length === 0 && <CardDescription>Select services to add them here.</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(proceedToPaymentSubmit)} className="space-y-6">
            <FormField control={form.control} name="customerId" render={({ field }) => ( <FormItem> <div className="text-sm font-medium mb-1">Customer</div> {(isLoadingAllCustomers && !customerIdFromQuery && !selectedCustomerName && !field.value) || (isLoadingSpecificCustomer && !selectedCustomerName && customerIdFromQuery) ? <Skeleton className="h-10 w-full" /> : <Select onValueChange={(value) => { field.onChange(value); const customer = allCustomers.find(c => c.id === value); setSelectedCustomerName(customer ? customer.name : null); }} value={field.value} disabled={!!customerIdFromQuery || isLoadingAllCustomers || isLoadingSpecificCustomer}> <FormControl><SelectTrigger><SelectValue placeholder={ isLoadingSpecificCustomer ? "Loading customer..." : (isLoadingAllCustomers && !field.value && !customerIdFromQuery) ? "Loading list..." : "Select a customer" }>{selectedCustomerName || (field.value && !isLoadingSpecificCustomer && !selectedCustomerName && "Select a customer")}</SelectValue></SelectTrigger></FormControl> <SelectContent>{allCustomers.map((customer) => (<SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.phone || 'No phone'})</SelectItem>))}</SelectContent></Select>} <FormDescription>{isLoadingSpecificCustomer ? 'Loading pre-selected customer...' : customerIdFromQuery && selectedCustomerName ? `Selected: ${selectedCustomerName}. To change, go back.` : customerIdFromQuery && !selectedCustomerName && !isLoadingSpecificCustomer ? `Failed to load customer (ID: ${customerIdFromQuery}). Select manually.` : isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName ? 'Loading customers...' : !watchedCustomerId && !customerIdFromQuery ? 'Select a customer.' : selectedCustomerName ? `Selected: ${selectedCustomerName}.` : ''}</FormDescription> <FormMessage /> </FormItem> )} />

            {fields.length > 0 && (
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin">
                {fields.map((fieldItem, index) => {
                  const item = watchedItems[index];
                  let itemEffectivePrice = item.unitPrice;
                  let itemTotal = item.unitPrice * item.quantity;
                  if (item.itemDiscountPercentage && item.itemDiscountPercentage > 0) itemTotal -= itemTotal * (item.itemDiscountPercentage / 100);
                  if (item.itemDiscountAmount && item.itemDiscountAmount > 0) itemTotal -= item.itemDiscountAmount;
                  itemTotal = Math.max(0, itemTotal);

                  return (
                  <Card key={fieldItem.id} className="p-3 space-y-2 bg-background border rounded-md shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{item?.serviceName}</h4>
                        <p className="text-xs text-muted-foreground">
                          Base Price: ${item?.originalUnitPrice?.toFixed(2)}
                          {item.unitPrice !== item.originalUnitPrice && ` (Overridden: $${item.unitPrice.toFixed(2)})`}
                        </p>
                        {(item.itemDiscountPercentage || item.itemDiscountAmount) && (
                          <p className="text-xs text-blue-600">
                            Discount: 
                            {item.itemDiscountPercentage ? ` ${item.itemDiscountPercentage}%` : ''}
                            {item.itemDiscountPercentage && item.itemDiscountAmount ? ' + ' : ''}
                            {item.itemDiscountAmount ? ` $${item.itemDiscountAmount.toFixed(2)}` : ''}
                          </p>
                        )}
                      </div>
                       <div className="flex items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-7 w-7">
                              <Pencil className="h-4 w-4" /> <span className="sr-only">Edit Item</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 space-y-3 p-4">
                            <h5 className="text-sm font-medium">Edit: {item.serviceName}</h5>
                            <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: subField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Override Unit Price</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...subField} onChange={e => subField.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.itemDiscountPercentage`} render={({ field: subField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Item Discount (%)</FormLabel>
                                <FormControl><Input type="number" step="0.1" min="0" max="100" {...subField} onChange={e => subField.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`items.${index}.itemDiscountAmount`} render={({ field: subField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Item Discount ($)</FormLabel>
                                <FormControl><Input type="number" step="0.01" min="0" {...subField} onChange={e => subField.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )} />
                          </PopoverContent>
                        </Popover>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" /> <span className="sr-only">Remove Item</span>
                        </Button>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-xs whitespace-nowrap">Qty:</FormLabel>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => { const q = item.quantity; if (q > 1) update(index, { ...item, quantity: q - 1 }); else remove(index); }}><MinusCircle className="h-4 w-4" /></Button>
                      <Input type="number" readOnly value={item.quantity} className="h-7 w-12 text-center px-1" />
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => update(index, { ...item, quantity: item.quantity + 1 })}><PlusCircle className="h-4 w-4" /></Button>
                      <FormField control={form.control} name={`items.${index}.notes`} render={({ field: subField }) => (<FormItem className="flex-grow"><FormControl><Input placeholder="Item notes..." {...subField} className="h-7 text-xs" /></FormControl><FormMessage className="text-xs" /></FormItem>)} />
                    </div>
                     {item.has_color_identifier && (
                        <FormField
                            control={form.control}
                            name={`items.${index}.color_value`}
                            render={({ field: subField }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Color</FormLabel>
                                <FormControl><Input placeholder="e.g., Red, Blue Pattern" {...subField} className="h-7 text-xs" /></FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                            )}
                        />
                    )}
                     <div className="text-right text-sm font-medium">Item Total: ${itemTotal.toFixed(2)}</div>
                     <FormField control={form.control} name={`items.${index}.quantity`} render={() => <FormMessage className="text-xs pt-1" />} />
                  </Card>
                );
              })}
              </div>
            )}
            {form.formState.errors.items && !form.formState.errors.items.root && !Array.isArray(form.formState.errors.items) && (<FormMessage>{form.formState.errors.items.message}</FormMessage>)}
            
            <FormItem className="flex flex-col"><div className="flex justify-between items-center"><FormLabel>Due Date (Optional)</FormLabel>{isExpressOrder && <Badge variant="destructive" className="text-xs"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}</div><div className="mt-1 grid grid-cols-4 gap-2"><Button type="button" className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white col-span-2" onClick={() => handleDueDateButtonClick(new Date())}>Today</Button><Button type="button" className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white col-span-2" onClick={() => handleDueDateButtonClick(addDays(new Date(), 1))}>Tomorrow</Button>{weekdays.map((day, index) => (<Button key={day} type="button" variant="default" className="h-9 px-3" onClick={() => handleDueDateButtonClick(getNextOccurrenceOfWeekday(index))}>{day}</Button>))}{ <Button type="button" variant="outline" size="sm" onClick={clearDueDate} className="h-9 px-2 text-xs col-span-1 self-center">Clear</Button>}</div><div className="mt-2 flex gap-2 items-center"><Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("flex-1 pl-3 text-left font-normal h-9", !watchedDueDate && "text-muted-foreground")}>{watchedDueDate ? format(new Date(watchedDueDate), "PPP") : <span>Pick specific date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={watchedDueDate ? new Date(watchedDueDate) : undefined} onSelect={handleManualDateSelect} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus/></PopoverContent></Popover></div><FormMessage /></FormItem>
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>General Order Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any special instructions" {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
            
            {/* Discount and Override Section */}
            <Separator />
            <div className="space-y-3 pt-2">
                <h3 className="text-md font-medium text-muted-foreground">Discounts & Overrides</h3>
                <FormField control={form.control} name="cartDiscountPercentage" render={({ field }) => (
                    <FormItem><FormLabel>Cart Discount (%)</FormLabel><FormControl><Input type="number" step="0.1" min="0" max="100" placeholder="e.g., 10" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-9"/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cartDiscountAmount" render={({ field }) => (
                    <FormItem><FormLabel>Cart Discount ($)</FormLabel><FormControl><Input type="number" step="0.01" min="0" placeholder="e.g., 5.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-9"/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cartPriceOverride" render={({ field }) => (
                    <FormItem><FormLabel>Cart Total Price Override ($)</FormLabel><FormControl><Input type="number" step="0.01" min="0" placeholder="e.g., 50.00 (leave blank if no override)" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-9"/></FormControl><FormDescription className="text-xs">If set, this becomes the final price regardless of other calculations.</FormDescription><FormMessage /></FormItem>
                )} />
            </div>
            <Separator />

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-md"><span>Subtotal:</span><span>${calculatedTotals.subtotal.toFixed(2)}</span></div>
              {(watchedCartDiscountPercentage || watchedCartDiscountAmount) && (
                <div className="flex justify-between items-center text-sm text-blue-600">
                    <span>Cart Discount Applied:</span>
                    <span>
                        - $
                        {(
                            calculatedTotals.subtotal - 
                            ( (watchedCartPriceOverride !== undefined && watchedCartPriceOverride >= 0) ? watchedCartPriceOverride : calculatedTotals.grandTotal )
                        ).toFixed(2)}
                    </span>
                </div>
              )}
              <div className="flex justify-between items-center font-semibold text-lg"><span>Grand Total:</span><span>${calculatedTotals.grandTotal.toFixed(2)}</span></div>
              <div className="space-y-2">
                <Button type="submit" disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName) || isLoadingServices} className="w-full">{form.formState.isSubmitting ? "Creating..." : isLoadingSpecificCustomer ? "Loading Customer..." : (isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName && !customerIdFromQuery) ? "Loading List..." : isLoadingServices ? "Loading Services..." : !watchedCustomerId ? "Select Customer First" : selectedCustomerName ? `Create & Proceed to Payment for ${selectedCustomerName.split(' ')[0]}`: `Create & Proceed to Payment`}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button type="button" variant="outline" onClick={handleCreateAndPayLater} disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName) || isLoadingServices} className="w-full">{form.formState.isSubmitting ? "Creating..." : `Create Order & Pay Later`}<Clock className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderPaymentOptionsCard = () => { 
    if (!createdOrderDetails) return null;
    const numericTotalAmount = createdOrderDetails.totalAmount; 
    let numericAmountTendered = parseFloat(amountTendered);
    if (isNaN(numericAmountTendered)) numericAmountTendered = 0;

    const changeDue = (selectedPaymentMethod === "Cash" && numericAmountTendered > numericTotalAmount)
      ? (numericAmountTendered - numericTotalAmount).toFixed(2)
      : null;

    return (
      <Card className="shadow-lg sticky top-6">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Order {createdOrderDetails.id}
            {createdOrderDetails.isExpress && <Badge variant="destructive" className="ml-2 text-xs"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}
          </CardTitle>
          <CardDescription>Total Amount: <strong>${numericTotalAmount.toFixed(2)}</strong></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activePaymentStep === "selectAction" && (
            <>
              <Button onClick={() => setActivePaymentStep("enterPaymentDetails")} className="w-full">
                <CheckCircle className="mr-2 h-5 w-5" /> Take Payment
              </Button>
              <Button variant="secondary" onClick={() => { setShowPrintDialog(true); }} className="w-full">
                <Clock className="mr-2 h-5 w-5" /> Pay Later & Options
              </Button>
            </>
          )}

          {activePaymentStep === "enterPaymentDetails" && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Amount Tendered</div>
                <div className="flex items-center space-x-2 cursor-pointer" onClick={handleOpenAmountKeypad}>
                    <Input id="amountTenderedInput" type="text" value={selectedPaymentMethod === "On Account" ? numericTotalAmount.toFixed(2) : amountTendered} readOnly placeholder={selectedPaymentMethod === "Cash" ? "Tap to enter cash amount" : numericTotalAmount.toFixed(2) } className="cursor-pointer flex-grow" disabled={selectedPaymentMethod === "On Account" || selectedPaymentMethod === "Card"} />
                    <Grid className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={selectedPaymentMethod === "Cash" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Cash"); setPaymentNote(""); if (numericTotalAmount > 0) setAmountTendered(""); else setAmountTendered("0.00"); setIsKeypadOpen(true); }}><Banknote className="mr-2 h-4 w-4"/> Cash</Button>
                <Button variant={selectedPaymentMethod === "Card" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Card"); setPaymentNote(""); setAmountTendered(numericTotalAmount.toFixed(2)); }}><WalletCards className="mr-2 h-4 w-4"/> Card</Button>
              </div>
               <Button variant={selectedPaymentMethod === "On Account" ? "default" : "outline"} onClick={handlePayOnAccount} className="w-full"><Archive className="mr-2 h-4 w-4" /> Pay on Account</Button>
              {paymentNote && <p className="text-sm text-muted-foreground">{paymentNote}</p>}
              {changeDue !== null && (<p className="text-md font-semibold text-green-600">Change Due: ${changeDue}</p>)}
              <div className="space-y-2 border-t pt-4">
                <Button onClick={handleConfirmPayment} className="w-full" disabled={!selectedPaymentMethod || (selectedPaymentMethod !== "On Account" && (amountTendered === "" || parseFloat(amountTendered) < 0 ) && numericTotalAmount > 0)}>Confirm Payment & Print Options</Button>
                <Button variant="ghost" onClick={() => setActivePaymentStep("selectAction")} className="w-full text-sm">Back</Button>
              </div>
            </div>
          )}
        </CardContent>
        {activePaymentStep === "selectAction" && (<CardFooter className="flex flex-col space-y-2 pt-4 border-t"><Button variant="outline" onClick={handleCreateAnotherOrder} className="w-full"><ShoppingCart className="mr-2 h-5 w-5" /> Create Another Order</Button><Button variant="ghost" onClick={handleGoToDashboard} className="w-full">Go to Dashboard</Button></CardFooter>)}
      </Card>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <AlphanumericKeypadModal isOpen={isKeypadOpen} onOpenChange={setIsKeypadOpen} inputValue={amountTendered} onInputChange={setAmountTendered} onConfirm={handleAmountKeypadConfirm} title="Enter Amount Tendered" numericOnly={true} />
      {createdOrderDetails && (<Dialog open={showPrintDialog} onOpenChange={(isOpen) => { setShowPrintDialog(isOpen); if (!isOpen && !printType && createdOrderDetails) { handlePayLaterAndNav(); } }}> <DialogContent><DialogHeader><DialogTitle className="flex items-center"><Printer className="mr-2 h-5 w-5"/>Print Options for Order {createdOrderDetails.id}{createdOrderDetails.isExpress && <Badge variant="destructive" className="ml-2 text-xs"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}</DialogTitle><DialogDescription>Select receipt type. Print dialog opens after navigation.</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-4 py-4"><Button onClick={() => handlePrintSelection('customer_copy')}>Customer Copy</Button><Button onClick={() => handlePrintSelection('shop_copy')}>Shop Copy</Button><Button onClick={() => handlePrintSelection('stubs')}>Item Stubs</Button><Button onClick={() => handlePrintSelection('all_tickets')}>All Tickets</Button></div><DialogFooter><Button variant="outline" onClick={() => { setShowPrintDialog(false); setPrintType(null); handlePayLaterAndNav(); }}>Skip Printing & View Order</Button></DialogFooter></DialogContent></Dialog>)}
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-2xl">Select Services for {isLoadingSpecificCustomer ? <Skeleton className="h-7 w-32 inline-block" /> : selectedCustomerName || 'Customer'}</CardTitle><CardDescription>Choose category, then click service to add.</CardDescription></CardHeader>
          <CardContent>{isLoadingServices ? (<div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>) : serviceCategoryNames.length > 0 ? (<Tabs defaultValue={serviceCategoryNames[0]} className="w-full"><TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 h-auto flex-wrap justify-start">{serviceCategoryNames.map((category) => (<TabsTrigger key={category} value={category} className="text-sm px-3 py-2 h-auto">{category}</TabsTrigger>))}</TabsList>{serviceCategoryNames.map((category) => (<TabsContent key={category} value={category}><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1 border-t pt-4">{servicesByCategory[category]?.map((service) => (<Button key={service.id} variant="outline" className="h-auto p-3 flex flex-col items-start text-left justify-between min-h-[60px] shadow-sm hover:shadow-md transition-shadow border-border bg-background" onClick={() => handleServiceItemClick(service)}><span className="font-medium text-sm">{service.name}</span><span className="text-xs text-primary">${service.price.toFixed(2)}</span></Button>))}</div></TabsContent>))}</Tabs>) : (<p>No services available. Add items in Settings.</p>)}</CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        {stage === "form" && renderOrderFormCard()}
        {stage === "paymentOptions" && renderPaymentOptionsCard()}
      </div>
    </div>
  );
}
