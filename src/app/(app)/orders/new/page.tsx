
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getCustomers, getCustomerById, getServices } from "@/lib/data";
import { getCompanySettingsAction } from "@/app/(auth)/settings/company-settings-actions";
import type { ServiceItem, Customer, CompanySettings, SpecialOffer } from "@/types";
import { CreateOrderSchema, type CreateOrderInput } from "./order.schema";
import { createOrderAction } from "@/app/(app)/orders/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock, CreditCard, 
  ArrowRight, Grid, Banknote, WalletCards, Printer, Zap, PlusCircle, 
  MinusCircle, Pencil, UserPlus, Search, User, X, Settings, Percent 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, addDays, isToday, isTomorrow, getDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AlphanumericKeypadModal } from "@/components/ui/alphanumeric-keypad-modal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import { recordPaymentAction } from "../payment-actions"; // Import the new action (adjust path if needed)
import { getSpecialOffersAction } from "@/app/(auth)/settings/special-offers-actions"; // Import this

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderCreationStage = "form" | "paymentOptions";
type PaymentStep = "selectAction" | "enterPaymentDetails";
type PaymentMethod = "Cash" | "Card" | "Part Pay" | null;

const getNextOccurrenceOfWeekday = (targetDay: number, startDate: Date = new Date()): Date => {
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const currentDay = getDay(currentDate);
  let daysToAdd = (targetDay - currentDay + 7) % 7;
  if (daysToAdd === 0 && currentDate.getTime() !== new Date(new Date().setHours(0,0,0,0)).getTime() && currentDay === targetDay) {
  }
  const resultDate = addDays(currentDate, daysToAdd);
  return resultDate;
};

const currencySymbols: { [key: string]: string } = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  CAD: 'C$',
  AUD: 'A$',
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

  const [customerSearchTerm, setCustomerSearchTerm] = React.useState("");
  const [isCustomerListVisible, setIsCustomerListVisible] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [allServices, setAllServices] = React.useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [servicesByCategory, setServicesByCategory] = React.useState<ServicesByCategory>({});
  const [serviceCategoryNames, setServiceCategoryNames] = React.useState<string[]>([]);
  
  const [companySettings, setCompanySettings] = React.useState<CompanySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const currencySymbol = currencySymbols[companySettings?.selected_currency || 'GBP'] || '£';

  const [activePaymentStep, setActivePaymentStep] = React.useState<PaymentStep>("selectAction");
  const [amountTendered, setAmountTendered] = React.useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>(null);
  const [isKeypadOpen, setIsKeypadOpen] = React.useState(false);
  const [paymentNote, setPaymentNote] = React.useState<string>("");

  const [showPrintDialog, setShowPrintDialog] = React.useState(false);
  const [printType, setPrintType] = React.useState<string | null>(null);

  const [isExpressOrder, setIsExpressOrder] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  // Modal states
  const [isOrderSettingsOpen, setIsOrderSettingsOpen] = React.useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = React.useState(false);

  const [activeOffers, setActiveOffers] = React.useState<SpecialOffer[]>([]);
  
  const [serviceSearchTerm, setServiceSearchTerm] = React.useState('');

  const filteredServices = React.useMemo(() => {
    if (!serviceSearchTerm) {
      return [];
    }
    return allServices.filter(service =>
      service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    );
  }, [serviceSearchTerm, allServices]);


  React.useEffect(() => {
    getSpecialOffersAction().then(data => {
      // Only keep active offers
      setActiveOffers(data.filter(o => o.is_active));
    });
  }, []);

  // Helper to check if item is in an offer
  const getOfferForItem = (serviceId: string, categoryId?: string | null) => {
    return activeOffers.find(offer => {
      const itemMatch = offer.eligible_items?.includes(serviceId);
      const catMatch = categoryId && offer.eligible_categories?.includes(categoryId);
      
      // Spend offers apply to whole cart, not specific items usually, so ignore here
      if (offer.offer_type_identifier === 'SPEND_GET_FREE_ITEM') return false;
      
      return itemMatch || catMatch;
    });
  };

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
    async function fetchInitialData() {
      setIsLoadingServices(true);
      setIsLoadingSettings(true);
      try {
        const [servicesData, settingsData] = await Promise.all([
          getServices(),
          getCompanySettingsAction(),
        ]);
        
        setAllServices(servicesData);
        const groupedServices = servicesData.reduce((acc, service) => {
          const category = service.category || "Other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(service);
          return acc;
        }, {} as ServicesByCategory);
        setServicesByCategory(groupedServices);
        setServiceCategoryNames(Object.keys(groupedServices));
        
        setCompanySettings(settingsData);

      } catch (err) {
        console.error("[NewOrderPage] Failed to fetch initial data:", err);
        toast({ title: "Error", description: "Could not load required services or settings.", variant: "destructive" });
      } finally {
        setIsLoadingServices(false);
        setIsLoadingSettings(false);
      }
    }
    fetchInitialData();
  }, [toast]);

  React.useEffect(() => {
    if (!customerIdFromQuery) {
        setIsLoadingAllCustomers(true);
        getCustomers()
            .then(setAllCustomers)
            .catch(err => console.error("[NewOrderPage] Failed to fetch customers for search:", err))
            .finally(() => setIsLoadingAllCustomers(false));
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
  }, [customerIdFromQuery, toast, form]);
  
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsCustomerListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchInputRef]);

  const handleSelectCustomer = (customer: Customer) => {
    form.setValue("customerId", customer.id, { shouldValidate: true });
    setSelectedCustomerName(customer.name);
    setCustomerSearchTerm("");
    setIsCustomerListVisible(false);
  };
  
  const watchedCustomerId = form.watch("customerId");

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearchTerm) return [];
    return allCustomers.filter(c =>
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.phone?.includes(customerSearchTerm)
    );
  }, [customerSearchTerm, allCustomers]);


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
      subtotal += Math.max(0, itemPrice);
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
    setSelectedCustomerName(null);
    setCustomerSearchTerm("");
    setIsLoadingAllCustomers(true);
    getCustomers().then(setAllCustomers).finally(() => setIsLoadingAllCustomers(false));
  }, [form]);

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

  const handleConfirmPayment = async () => {
    if (!createdOrderDetails) return;
    
    const numericTotalAmount = createdOrderDetails.totalAmount;
    let numericAmountTendered = parseFloat(amountTendered) || 0;

    // If Cash, we only record up to the total amount (no tip tracking yet) or the exact part-pay amount
    // For this logic, we'll assume the amount entered is what we want to record.
    const paymentAmount = numericAmountTendered;

    if (!selectedPaymentMethod) {
        toast({ title: "Error", description: "Please select a payment method.", variant: "destructive" });
        return;
    }

    // Call the Server Action
    const result = await recordPaymentAction(
        createdOrderDetails.id,
        paymentAmount,
        selectedPaymentMethod,
        paymentNote
    );

    if (result.success) {
        let paymentDetailsMessage = `Payment of ${currencySymbol}${paymentAmount.toFixed(2)} recorded.`;
        
        if (numericAmountTendered < numericTotalAmount) {
             paymentDetailsMessage += ` Remaining Balance: ${currencySymbol}${(numericTotalAmount - numericAmountTendered).toFixed(2)}`;
        } else if (numericAmountTendered > numericTotalAmount && selectedPaymentMethod === "Cash") {
             paymentDetailsMessage += ` Change Due: ${currencySymbol}${(numericAmountTendered - numericTotalAmount).toFixed(2)}`;
        }

        toast({ title: "Payment Successful", description: paymentDetailsMessage });
        
        setPrintType(null); 
        setShowPrintDialog(true);
    } else {
        toast({ title: "Payment Failed", description: result.message, variant: "destructive" });
    }
  };

  const handlePrintSelection = (selectedType: string) => {
    setPrintType(selectedType); setShowPrintDialog(false);
    if (createdOrderDetails) { const queryParams = `?autoprint=true&printType=${selectedType}${createdOrderDetails.isExpress ? '&express=true' : ''}`; router.push(`/orders/${createdOrderDetails.id}${queryParams}`); resetFormAndStage(); }
  };

  const handlePayLaterAndNav = () => { if (!createdOrderDetails) return; const queryParams = createdOrderDetails.isExpress ? '?express=true' : ''; router.push(`/orders/${createdOrderDetails.id}${queryParams}`); resetFormAndStage(); };
  const handleCreateAnotherOrder = () => { resetFormAndStage(); };
  const handleGoToDashboard = () => router.push('/dashboard');
  const handleAmountKeypadConfirm = (value: string) => { const numValue = parseFloat(value); if (isNaN(numValue) || numValue < 0) { setAmountTendered(createdOrderDetails?.totalAmount.toFixed(2) || "0.00"); toast({title: "Invalid Amount", variant: "destructive"}); } else { setAmountTendered(numValue.toFixed(2)); } };
  const handleOpenAmountKeypad = React.useCallback(() => { setIsKeypadOpen(true); }, []);
  const handleDueDateButtonClick = (date: Date) => { form.setValue('dueDate', date, { shouldValidate: true }); setIsExpressOrder(isToday(date) || isTomorrow(date)); };
  const handleManualDateSelect = (date: Date | undefined) => { form.setValue('dueDate', date, { shouldValidate: true }); if (date) setIsExpressOrder(isToday(date) || isTomorrow(date)); else setIsExpressOrder(false); setIsDatePickerOpen(false); };
  const clearDueDate = () => { form.setValue('dueDate', undefined, { shouldValidate: true }); setIsExpressOrder(false); };
  
  const renderOrderFormCard = () => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(proceedToPaymentSubmit)} className="h-full flex flex-col">
            <Card className="shadow-lg h-full flex flex-col">
            <CardHeader className="py-4">
                <CardTitle className="font-headline text-xl flex items-center justify-between">
                    <div className="flex items-center"><ShoppingCart className="mr-2 h-6 w-6" /> Current Order</div>
                    <Badge variant="outline" className="ml-2 font-mono text-sm">
                        {fields.length} Item{fields.length !== 1 && 's'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                <div className="flex-1 flex flex-col overflow-hidden px-4 space-y-3">
                    {/* Customer Selection */}
                    <div className="pt-2">
                         <FormField control={form.control} name="customerId" render={({ field }) => (
                            <FormItem className="space-y-1">
                                {selectedCustomerName && field.value ? (
                                    <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <User className="h-5 w-5 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{selectedCustomerName}</span>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                            form.setValue("customerId", "");
                                            setSelectedCustomerName(null);
                                            setCustomerSearchTerm("");
                                        }}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="relative" ref={searchInputRef}>
                                        <FormControl>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search customer..."
                                                    value={customerSearchTerm}
                                                    onChange={(e) => {
                                                        setCustomerSearchTerm(e.target.value);
                                                        setIsCustomerListVisible(true);
                                                    }}
                                                    onFocus={() => setIsCustomerListVisible(true)}
                                                    className="pl-9 h-9"
                                                />
                                            </div>
                                        </FormControl>
                                        {isCustomerListVisible && (isLoadingAllCustomers || filteredCustomers.length > 0) && (
                                            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {isLoadingAllCustomers ? (
                                                    <div className="p-3 text-sm text-muted-foreground">Loading...</div>
                                                ) : (
                                                    filteredCustomers.map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            className="p-3 hover:bg-accent cursor-pointer"
                                                            onClick={() => handleSelectCustomer(customer)}
                                                        >
                                                            <p className="font-medium">{customer.name}</p>
                                                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                        <div className="flex justify-end mt-1">
                                             <Link href="/customers/new" passHref>
                                                <span className="text-xs text-primary flex items-center cursor-pointer hover:underline"><UserPlus className="mr-1 h-3 w-3"/> New Customer</span>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {/* Scrollable Item List */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 pb-2">
                        {fields.length > 0 ? (
                            fields.map((fieldItem, index) => {
                            const item = watchedItems[index];
                            let itemTotal = item.unitPrice * item.quantity;
                            if (item.itemDiscountPercentage && item.itemDiscountPercentage > 0) itemTotal -= itemTotal * (item.itemDiscountPercentage / 100);
                            if (item.itemDiscountAmount && item.itemDiscountAmount > 0) itemTotal -= item.itemDiscountAmount;
                            itemTotal = Math.max(0, itemTotal);
                            const serviceDetails = allServices.find(s => s.id === item.serviceItemId);
                            const activeOffer = getOfferForItem(item.serviceItemId, serviceDetails?.categoryId);

                            return (
                                <Card key={fieldItem.id} className={`p-2 space-y-2 bg-background border rounded-md shadow-sm ${activeOffer ? 'border-l-4 border-l-green-500' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm line-clamp-1 flex items-center gap-2">
                                                {item?.serviceName}
                                                {activeOffer && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-700 border-green-200">
                                                        {activeOffer.offer_type_identifier === 'BUY_X_GET_Y' ? 'Promo' : 'Bundle'}
                                                    </Badge>
                                                )}
                                            </h4>
                                            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                                <span>{currencySymbol}{item?.originalUnitPrice?.toFixed(2)}</span>
                                                {item.unitPrice !== item.originalUnitPrice && <span className="text-amber-600 font-bold">(Set: {currencySymbol}{item.unitPrice.toFixed(2)})</span>}
                                            </div>
                                            {(item.itemDiscountPercentage || item.itemDiscountAmount) && (
                                                <p className="text-xs text-blue-600">
                                                    Disc: {item.itemDiscountPercentage ? `${item.itemDiscountPercentage}%` : ''}
                                                    {item.itemDiscountAmount ? ` -${currencySymbol}${item.itemDiscountAmount.toFixed(2)}` : ''}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right font-semibold text-sm">
                                            {currencySymbol}{itemTotal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-2">
                                        {/* Qty Controls */}
                                        <div className="flex items-center bg-secondary/50 rounded-md p-0.5">
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 hover:bg-white" onClick={() => { const q = item.quantity; if (q > 1) update(index, { ...item, quantity: q - 1 }); else remove(index); }}>
                                                <MinusCircle className="h-3.5 w-3.5" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 hover:bg-white" onClick={() => update(index, { ...item, quantity: item.quantity + 1 })}>
                                                <PlusCircle className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex gap-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72 space-y-3 p-4">
                                                    <h5 className="text-sm font-medium">Edit Item: {item.serviceName}</h5>
                                                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: subField }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Override Unit Price</FormLabel>
                                                        <FormControl><Input type="number" step="0.01" {...subField} onChange={e => subField.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                                    </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`items.${index}.itemDiscountPercentage`} render={({ field: subField }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Item Discount (%)</FormLabel>
                                                        <FormControl><Input type="number" step="0.1" min="0" max="100" {...subField} onChange={e => subField.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                                    </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`items.${index}.itemDiscountAmount`} render={({ field: subField }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Item Discount ({currencySymbol})</FormLabel>
                                                        <FormControl><Input type="number" step="0.01" min="0" {...subField} onChange={e => subField.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                                    </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name={`items.${index}.notes`} render={({ field: subField }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Item Note</FormLabel>
                                                            <FormControl><Input placeholder="Add note..." {...subField} className="h-8" /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                </PopoverContent>
                                            </Popover>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <FormField control={form.control} name={`items.${index}.quantity`} render={() => <FormMessage className="text-xs pt-1" />} />
                                </Card>
                            );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                                <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">Cart is empty</p>
                                <p className="text-xs">Select services to start</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex-col items-stretch space-y-0 pt-2 pb-4 border-t px-4">
                {/* --- Action Buttons for Modals --- */}
                <div className="flex gap-2 py-2">
                    <Dialog open={isOrderSettingsOpen} onOpenChange={setIsOrderSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs">
                                <Settings className="mr-2 h-3.5 w-3.5" /> Order Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Order Settings</DialogTitle>
                                <DialogDescription>Manage due dates and notes for this order.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                 <FormField control={form.control} name="dueDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <div className="grid grid-cols-4 gap-2">
                                        <Button type="button" size="sm" className="bg-red-600 hover:bg-red-700 text-white col-span-2" onClick={() => handleDueDateButtonClick(new Date())}>Today</Button>
                                        <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white col-span-2" onClick={() => handleDueDateButtonClick(addDays(new Date(), 1))}>Tomorrow</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={clearDueDate} className="col-span-4">Clear Date</Button>
                                    </div>
                                    <div className="mt-2">
                                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(new Date(field.value), "PPP") : <span>Pick specific date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={handleManualDateSelect} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus/>
                                        </PopoverContent>
                                        </Popover>
                                    </div>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Order Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Special instructions..." {...field} rows={3} />
                                    </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <DialogFooter>
                                <Button type="button" onClick={() => setIsOrderSettingsOpen(false)}>Done</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs">
                                <Percent className="mr-2 h-3.5 w-3.5" /> Discounts
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Discounts & Overrides</DialogTitle>
                                <DialogDescription>Apply global discounts to the entire cart.</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                            <div className="space-y-4 py-2">
                                <FormField control={form.control} name="cartDiscountPercentage" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cart Discount (%)</FormLabel>
                                        <FormControl><Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 10" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="cartDiscountAmount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cart Discount ({currencySymbol})</FormLabel>
                                        <FormControl><Input type="number" step="0.01" min="0" placeholder="e.g. 5.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="cartPriceOverride" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Price Override ({currencySymbol})</FormLabel>
                                        <FormControl><Input type="number" step="0.01" min="0" placeholder="e.g. 50.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                        <FormDescription>Overrides the final calculated total.</FormDescription>
                                    </FormItem>
                                )} />
                            </div>
                            </Form>
                             <DialogFooter>
                                <Button type="button" onClick={() => setIsDiscountModalOpen(false)}>Done</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Separator className="mb-2" />
                
                {/* --- Totals & Main Actions --- */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-md"><span>Subtotal:</span><span>{currencySymbol}{calculatedTotals.subtotal.toFixed(2)}</span></div>
                    {(watchedCartDiscountPercentage || watchedCartDiscountAmount) && (
                    <div className="flex justify-between items-center text-sm text-blue-600">
                        <span>Discount:</span>
                        <span>
                            - {currencySymbol}
                            {(
                                calculatedTotals.subtotal - 
                                ( (watchedCartPriceOverride !== undefined && watchedCartPriceOverride >= 0) ? watchedCartPriceOverride : calculatedTotals.grandTotal )
                            ).toFixed(2)}
                        </span>
                    </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-xl py-1"><span>Total:</span><span>{currencySymbol}{calculatedTotals.grandTotal.toFixed(2)}</span></div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                         <Button type="button" variant="outline" onClick={handleCreateAndPayLater} disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingServices} className="w-full text-xs h-10">
                            {form.formState.isSubmitting ? "..." : `Pay Later`} <Clock className="ml-1 h-3 w-3" />
                         </Button>
                         <Button type="submit" disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingServices} className="w-full text-xs h-10 font-bold">
                            {form.formState.isSubmitting ? "..." : `PAY NOW`} <ArrowRight className="ml-1 h-3 w-3" />
                         </Button>
                    </div>
                </div>
            </CardFooter>
            </Card>
        </form>
      </Form>
    );
  };

  const renderPaymentOptionsCard = () => { 
    if (!createdOrderDetails) return null;
    const numericTotalAmount = createdOrderDetails.totalAmount; 
    let numericAmountTendered = parseFloat(amountTendered);
    if (isNaN(numericAmountTendered)) numericAmountTendered = 0;

    const changeDue = (selectedPaymentMethod === "Cash" && numericAmountTendered > numericTotalAmount)
      ? (numericAmountTendered - numericTotalAmount).toFixed(2)
      : null;

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Order {createdOrderDetails.id}
            {createdOrderDetails.isExpress && <Badge variant="destructive" className="ml-2 text-xs"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}
          </CardTitle>
          <CardDescription>Total Amount: <strong>{currencySymbol}{numericTotalAmount.toFixed(2)}</strong></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activePaymentStep === "selectAction" && (
            <>
              <Button onClick={() => setActivePaymentStep("enterPaymentDetails")} className="w-full">
                <CheckCircle className="mr-2 h-5 w-5" /> Take Payment
              </Button>
              <Button variant="secondary" onClick={()=>{ setShowPrintDialog(true); }} className="w-full">
                <Clock className="mr-2 h-5 w-5" /> Pay Later & Options
              </Button>
            </>
          )}

          {activePaymentStep === "enterPaymentDetails" && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Amount Tendered</div>
                <div className="flex items-center space-x-2 cursor-pointer" onClick={handleOpenAmountKeypad}>
                    <Input id="amountTenderedInput" type="text" value={amountTendered} readOnly placeholder={selectedPaymentMethod === "Cash" || selectedPaymentMethod === "Part Pay" ? "Tap to enter amount" : numericTotalAmount.toFixed(2) } className="cursor-pointer flex-grow" disabled={selectedPaymentMethod === "Card"} />
                    <Grid className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant={selectedPaymentMethod === "Cash" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Cash"); setPaymentNote(""); if (numericTotalAmount > 0) setAmountTendered(""); else setAmountTendered("0.00"); setIsKeypadOpen(true); }}><Banknote className="mr-2 h-4 w-4"/> Cash</Button>
                <Button variant={selectedPaymentMethod === "Card" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Card"); setPaymentNote(""); setAmountTendered(numericTotalAmount.toFixed(2)); }}><WalletCards className="mr-2 h-4 w-4"/> Card</Button>
                <Button variant={selectedPaymentMethod === "Part Pay" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Part Pay"); setPaymentNote("Deposit Paid."); setAmountTendered(""); setIsKeypadOpen(true); }}>Part Pay</Button>
              </div>
              {paymentNote && <p className="text-sm text-muted-foreground">{paymentNote}</p>}
              {changeDue !== null && (<p className="text-md font-semibold text-green-600">Change Due: {currencySymbol}{changeDue}</p>)}
              <div className="space-y-2 border-t pt-4">
                <Button onClick={handleConfirmPayment} className="w-full" disabled={!selectedPaymentMethod || ((amountTendered === "" || parseFloat(amountTendered) < 0 ) && numericTotalAmount > 0)}>Confirm Payment & Print Options</Button>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">
                    Select Services for {isLoadingSpecificCustomer ? <Skeleton className="h-7 w-32 inline-block" /> : selectedCustomerName || 'Customer'}
                </CardTitle>
                <CardDescription>Choose category, then click service to add.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingServices ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for a service..."
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {serviceSearchTerm ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1 border-t pt-4">
                        {filteredServices.length > 0 ? (
                          filteredServices.map((service) => (
                            <Button key={service.id} variant="outline" className="h-auto p-3 flex flex-col items-start text-left justify-between min-h-[60px] shadow-sm hover:shadow-md transition-shadow border-border bg-background" onClick={() => handleServiceItemClick(service)}>
                                <span className="font-medium text-sm">{service.name}</span>
                                <span className="text-xs text-primary">{currencySymbol}{service.price.toFixed(2)}</span>
                            </Button>
                          ))
                        ) : (
                          <p className="col-span-full text-center text-muted-foreground">No services found for "{serviceSearchTerm}".</p>
                        )}
                      </div>
                    ) : serviceCategoryNames.length > 0 ? (
                      <Tabs defaultValue={serviceCategoryNames[0]} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 mb-4 h-auto flex-wrap justify-start">
                              {serviceCategoryNames.map((category) => (
                                  <TabsTrigger key={category} value={category} className="text-sm px-3 py-2 h-auto">{category}</TabsTrigger>
                              ))}
                          </TabsList>
                          {serviceCategoryNames.map((category) => (
                              <TabsContent key={category} value={category}>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1 border-t pt-4">
                                      {servicesByCategory[category]?.map((service) => (
                                          <Button key={service.id} variant="outline" className="h-auto p-3 flex flex-col items-start text-left justify-between min-h-[60px] shadow-sm hover:shadow-md transition-shadow border-border bg-background" onClick={() => handleServiceItemClick(service)}>
                                              <span className="font-medium text-sm">{service.name}</span>
                                              <span className="text-xs text-primary">{currencySymbol}{service.price.toFixed(2)}</span>
                                          </Button>
                                      ))}
                                  </div>
                              </TabsContent>
                          ))}
                      </Tabs>
                    ) : (
                        <p>No services available. Add items in Settings.</p>
                    )}
                  </>
                )}
            </CardContent>
          </Card>
      </div>

      <div className="lg:col-span-1 sticky top-6 h-[calc(100vh-3.5rem-2rem)]">
          {stage === "form" && renderOrderFormCard()}
          {stage === "paymentOptions" && renderPaymentOptionsCard()}
      </div>

      <AlphanumericKeypadModal isOpen={isKeypadOpen} onOpenChange={setIsKeypadOpen} inputValue={amountTendered} onInputChange={setAmountTendered} onConfirm={handleAmountKeypadConfirm} title="Enter Amount Tendered" numericOnly={true} />
      
      {createdOrderDetails && (<Dialog open={showPrintDialog} onOpenChange={(isOpen) => { setShowPrintDialog(isOpen); if (!isOpen && !printType && createdOrderDetails) { handlePayLaterAndNav(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Printer className="mr-2 h-5 w-5"/>Print Options for Order {createdOrderDetails.id}{createdOrderDetails.isExpress && <Badge variant="destructive" className="ml-2 text-xs"><Zap className="mr-1 h-3 w-3"/>Express</Badge>}
            </DialogTitle>
            <DialogDescription>
              Select the type of receipt or ticket you want to print. The print dialog will open after navigation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button onClick={() => handlePrintSelection('customer_copy')}>Customer Copy</Button>
            <Button onClick={() => handlePrintSelection('shop_copy')}>Shop Copy</Button>
            <Button onClick={() => handlePrintSelection('stubs')}>Item Stubs</Button>
            <Button onClick={() => handlePrintSelection('all_tickets')}>All Tickets</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPrintDialog(false); setPrintType(null); handlePayLaterAndNav(); }}>Skip Printing & View Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>)}
      
    </div>
  );
}
