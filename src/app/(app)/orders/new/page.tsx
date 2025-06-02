
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getCustomers, getCustomerById, getMockServices } from "@/lib/data";
import type { ServiceItem, Customer } from "@/types";
import { CreateOrderSchema, type CreateOrderInput } from "./order.schema";
import { createOrderAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock, CreditCard, ArrowRight, Archive, Grid, Banknote, WalletCards } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AlphanumericKeypadModal } from "@/components/ui/alphanumeric-keypad-modal";

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderCreationStage = "form" | "paymentOptions";
type PaymentStep = "selectAction" | "enterPaymentDetails";
type PaymentMethod = "Cash" | "Card" | "On Account" | null;

export default function NewOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = React.useState<OrderCreationStage>("form");
  const [createdOrderDetails, setCreatedOrderDetails] = React.useState<{ id: string; message: string; totalAmount: number } | null>(null);

  // Customer related states
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [isLoadingAllCustomers, setIsLoadingAllCustomers] = React.useState(false);
  const [isLoadingSpecificCustomer, setIsLoadingSpecificCustomer] = React.useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = React.useState<string | null>(null);

  // Services related states
  const [allServices, setAllServices] = React.useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [servicesByCategory, setServicesByCategory] = React.useState<ServicesByCategory>({});
  const [serviceCategoryNames, setServiceCategoryNames] = React.useState<string[]>([]);

  // Payment related states
  const [activePaymentStep, setActivePaymentStep] = React.useState<PaymentStep>("selectAction");
  const [amountTendered, setAmountTendered] = React.useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>(null);
  const [isKeypadOpen, setIsKeypadOpen] = React.useState(false);
  const [paymentNote, setPaymentNote] = React.useState<string>("");


  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customerId: "",
      items: [],
      dueDate: undefined,
      notes: "",
    },
  });

  const customerIdFromQueryRaw = searchParams.get('customerId');
  const customerIdFromQuery = customerIdFromQueryRaw?.trim();

  React.useEffect(() => {
    if (!customerIdFromQuery) {
      setIsLoadingAllCustomers(true);
      getCustomers()
        .then(data => {
          setAllCustomers(data);
          console.log('[NewOrderPage] Successfully fetched all customers. Count:', data.length);
          console.log('[NewOrderPage] All customer IDs fetched:', data.map(c => `ID: '${c.id}' (length ${c.id.length}) Name: ${c.name}`));
        })
        .catch(err => {
          console.error("[NewOrderPage] Failed to fetch customers:", err);
          toast({ title: "Error", description: "Could not load customer list.", variant: "destructive" });
        })
        .finally(() => setIsLoadingAllCustomers(false));
    } else {
      setAllCustomers([]); // Don't load all if a specific one is targetted
      setIsLoadingAllCustomers(false);
    }
  }, [customerIdFromQuery, toast]);

  React.useEffect(() => {
    if (customerIdFromQuery) {
      setIsLoadingSpecificCustomer(true);
      setSelectedCustomerName(null); // Reset name while loading new one
      form.setValue('customerId', ''); // Clear form field initially

      console.log('[NewOrderPage] useEffect for specific customer. Raw customerIdFromQuery from URL:', customerIdFromQueryRaw);
      console.log(`[NewOrderPage] Trimmed customerIdFromQuery for Supabase: '${customerIdFromQuery}' (length ${customerIdFromQuery.length})`);

      getCustomerById(customerIdFromQuery)
        .then(customer => {
          console.log('[NewOrderPage] getCustomerById promise resolved. Customer data received:', JSON.stringify(customer));
          if (customer) {
            console.log(`[NewOrderPage] Customer FOUND by ID from URL: Name: ${customer.name}, ID: '${customer.id}' (length ${customer.id.length})`);
            form.setValue('customerId', customer.id, { shouldValidate: true });
            setSelectedCustomerName(customer.name);
          } else {
            console.warn(`[NewOrderPage] Customer NOT FOUND by ID from URL: '${customerIdFromQuery}'. getCustomerById returned null/undefined.`);
            toast({
              title: "Customer Not Loaded",
              description: `Failed to load customer (ID: ${customerIdFromQuery}). Select manually or go back. Check server logs from 'getCustomerById' for details (RLS/existence).`,
              variant: "warning",
              duration: 15000
            });
            form.setValue('customerId', ''); // Ensure form field is cleared if not found
            setSelectedCustomerName(null);
          }
        })
        .catch(err => {
          console.error("[NewOrderPage] Error fetching pre-selected customer by ID from URL:", err);
          toast({
            title: "Error Loading Customer by ID",
            description: `Could not load details for the pre-selected customer (ID: '${customerIdFromQuery}'). Error: ${err.message || 'Unknown error'}. Check server logs for details from 'getCustomerById'. Please try selecting manually.`,
            variant: "destructive",
            duration: 15000
          });
          form.setValue('customerId', '');
          setSelectedCustomerName(null);
        })
        .finally(() => setIsLoadingSpecificCustomer(false));
    } else {
      setIsLoadingSpecificCustomer(false); // Ensure this is false if no ID from query
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdFromQuery, toast]); // form.setValue removed

  const watchedCustomerId = form.watch("customerId");

  React.useEffect(() => {
    if (isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !customerIdFromQuery)) {
      return;
    }

    if (watchedCustomerId) {
      // If customerId came from URL and matches current form value, name is likely set by specific load
      if (customerIdFromQuery && watchedCustomerId === customerIdFromQuery) {
        // selectedCustomerName should have been set by the specific customer fetch.
        // If somehow it's not, try to find from allCustomers as a fallback (though allCustomers might be empty here).
        if (!selectedCustomerName && allCustomers.length > 0) {
           const customer = allCustomers.find(c => c.id === watchedCustomerId);
           if (customer) setSelectedCustomerName(customer.name);
        }
      } else { // Customer was selected from dropdown
        const customer = allCustomers.find(c => c.id === watchedCustomerId);
        if (customer) {
          setSelectedCustomerName(customer.name);
           console.log(`[NewOrderPage] Customer selected from dropdown: ID: '${customer.id}' (length ${customer.id.length}), Name: ${customer.name}`);
        } else if (!customerIdFromQuery) { // Only clear if not initiated by URL param
          setSelectedCustomerName(null);
        }
      }
    } else {
      // If no customerId is in form and none came from URL, ensure name is cleared
      if (!customerIdFromQuery) {
        setSelectedCustomerName(null);
      }
    }
  }, [watchedCustomerId, allCustomers, customerIdFromQuery, isLoadingAllCustomers, isLoadingSpecificCustomer]);


  React.useEffect(() => {
    async function fetchServices() {
      setIsLoadingServices(true);
      try {
        const servicesData = await getMockServices();
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
    fetchServices();
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
      append({ serviceItemId: service.id, serviceName: service.name, unitPrice: service.price, quantity: 1, notes: "" });
    }
  };

  const watchedItems = form.watch("items");
  const orderTotal = React.useMemo(() => watchedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0), [watchedItems]);

  const resetFormAndStage = React.useCallback(() => {
    form.reset({ customerId: "", items: [], dueDate: undefined, notes: "" });
    setStage("form");
    setCreatedOrderDetails(null);
    setSelectedCustomerName(null);
    setActivePaymentStep("selectAction");
    setAmountTendered("");
    setSelectedPaymentMethod(null);
    setIsKeypadOpen(false);
    setPaymentNote("");

    if (!searchParams.get('customerId')) {
        setIsLoadingAllCustomers(true);
        getCustomers().then(data => setAllCustomers(data))
        .catch(() => {})
        .finally(() => setIsLoadingAllCustomers(false));
    }
  }, [form, searchParams]);

  async function proceedToPaymentSubmit(data: CreateOrderInput) {
    const result = await createOrderAction(data);
    if (result.success && result.orderId) {
      toast({ title: "Order Created", description: result.message });
      setCreatedOrderDetails({ id: result.orderId, message: result.message || "Order created!", totalAmount: orderTotal });
      setStage("paymentOptions");
      setActivePaymentStep("selectAction"); // Reset to action selection
      setAmountTendered(orderTotal.toFixed(2)); // Pre-fill amount tendered
      setSelectedPaymentMethod(null);
      setPaymentNote("");
    } else {
      toast({
        title: "Error Creating Order",
        description: result.errors ? JSON.stringify(result.errors) : "Failed to create order. Please check form.",
        variant: "destructive",
      });
    }
  }

  async function handleCreateAndPayLater() {
    const isValid = await form.trigger();
    if (!isValid) {
        toast({ title: "Validation Error", description: "Please check the form for errors.", variant: "destructive" });
        return;
    }
    if (fields.length === 0) {
      form.setError("items", { type: "manual", message: "Order must have at least one item." });
      toast({ title: "Validation Error", description: "Order must have at least one item.", variant: "destructive" });
      return;
    }
    const data = form.getValues();
    const result = await createOrderAction(data);
    if (result.success && result.orderId) {
      toast({ title: "Order Created (Pay Later)", description: result.message });
      router.push(`/orders/${result.orderId}`);
      resetFormAndStage();
      router.push('/find-or-add-customer');
    } else {
      toast({
        title: "Error Creating Order",
        description: result.errors ? JSON.stringify(result.errors) : "Failed to create order.",
        variant: "destructive",
      });
    }
  }

  const handleConfirmPayment = () => {
    if (!createdOrderDetails) return;
    let paymentDetailsMessage = "";
    const numericAmountTendered = parseFloat(amountTendered) || 0;

    if (selectedPaymentMethod === "On Account") {
      paymentDetailsMessage = `Order ${createdOrderDetails.id} ($${createdOrderDetails.totalAmount.toFixed(2)}) marked as 'Payment on Account'.`;
    } else if (selectedPaymentMethod === "Cash" || selectedPaymentMethod === "Card") {
      const paymentType = selectedPaymentMethod === "Cash" ? "Cash" : "Card";
      let paymentSummary = `Paid ${numericAmountTendered.toFixed(2)} by ${paymentType}.`;
      if (numericAmountTendered < createdOrderDetails.totalAmount) {
        paymentSummary += ` (Partial Payment - $${(createdOrderDetails.totalAmount - numericAmountTendered).toFixed(2)} remaining).`;
      } else if (numericAmountTendered > createdOrderDetails.totalAmount && selectedPaymentMethod === "Cash") {
        paymentSummary += ` Change: $${(numericAmountTendered - createdOrderDetails.totalAmount).toFixed(2)}.`;
      }
      paymentDetailsMessage = `Payment for order ${createdOrderDetails.id}: ${paymentSummary}`;
    } else {
       paymentDetailsMessage = `Order ${createdOrderDetails.id} processed. No payment method selected or amount tendered.`;
    }


    toast({ title: "Payment Processed (Mocked)", description: paymentDetailsMessage });
    router.push(`/orders/${createdOrderDetails.id}`);
    resetFormAndStage();
  };

  const handlePayLaterAndNav = () => {
    if (!createdOrderDetails) return;
    router.push(`/orders/${createdOrderDetails.id}`);
    resetFormAndStage();
  };

  const handleCreateAnotherOrder = () => {
    resetFormAndStage();
    router.push('/find-or-add-customer');
  };

  const handleGoToDashboard = () => router.push('/dashboard');

  const handleAmountKeypadConfirm = (value: string) => {
    setAmountTendered(value);
    // Basic validation, ensure it's a non-negative number after confirm
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        setAmountTendered(createdOrderDetails?.totalAmount.toFixed(2) || "0.00"); // Revert to total or 0 if invalid
        toast({title: "Invalid Amount", description: "Please enter a valid numeric amount.", variant: "destructive"});
    }
  };
  
  const handlePayOnAccount = () => {
    setSelectedPaymentMethod("On Account");
    setAmountTendered(createdOrderDetails?.totalAmount.toFixed(2) || "0.00"); // Set to full amount conceptually
    setPaymentNote(`Order total of $${createdOrderDetails?.totalAmount.toFixed(2)} will be charged to customer account.`);
  };


  const renderOrderFormCard = () => (
    <Card className="shadow-lg sticky top-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <ShoppingCart className="mr-2 h-6 w-6" /> Current Order
        </CardTitle>
        {fields.length === 0 && <CardDescription>Select services to add them here.</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(proceedToPaymentSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  {(isLoadingAllCustomers && !customerIdFromQuery && !selectedCustomerName && !field.value) || (isLoadingSpecificCustomer && !selectedCustomerName && customerIdFromQuery) ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!customerIdFromQuery || isLoadingAllCustomers || isLoadingSpecificCustomer}
                  >
                    <FormControl>
                       <SelectTrigger>
                        <SelectValue placeholder={
                            isLoadingSpecificCustomer ? "Loading customer..." :
                            selectedCustomerName ? selectedCustomerName : // Primary display for selected name
                            (isLoadingAllCustomers && !watchedCustomerId && !field.value) ? "Loading customer list..." :
                            "Select a customer"
                          }>
                           {selectedCustomerName || (field.value && !isLoadingSpecificCustomer && "Select a customer")}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phone || 'No phone'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                  <FormDescription>
                     {isLoadingSpecificCustomer ? 'Loading pre-selected customer details...'
                       : customerIdFromQuery && selectedCustomerName ? `Selected: ${selectedCustomerName}. To change, go back.`
                       : customerIdFromQuery && !selectedCustomerName && !isLoadingSpecificCustomer ? `Failed to load customer (ID: ${customerIdFromQuery}). Select manually or go back.`
                       : isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName ? 'Loading customer list...'
                       : !watchedCustomerId && !customerIdFromQuery ? 'Select a customer for this order.'
                       : selectedCustomerName ? `Selected: ${selectedCustomerName}.`
                       : ''}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fields.length > 0 && (
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-3 space-y-3 bg-background border rounded-md shadow-sm">
                    <div>
                      <h4 className="font-medium text-sm">{watchedItems[index]?.serviceName}</h4>
                      <p className="text-xs text-muted-foreground">Price: ${watchedItems[index]?.unitPrice?.toFixed(2)}</p>
                    </div>
                    <div className="flex items-end gap-3">
                      <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: itemField }) => (<FormItem className="flex-1"><FormLabel className="text-xs">Qty</FormLabel><FormControl><Input type="number" {...itemField} min="1" className="h-9"/></FormControl><FormMessage /></FormItem>)} />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /><span className="sr-only">Remove Item</span></Button>
                    </div>
                    <FormField control={form.control} name={`items.${index}.notes`} render={({ field: itemField }) => (<FormItem><FormLabel className="text-xs">Item Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Heavy starch" {...itemField} rows={1} className="text-xs"/></FormControl><FormMessage /></FormItem>)} />
                  </Card>
                ))}
              </div>
            )}
             {form.formState.errors.items && !form.formState.errors.items.root && !Array.isArray(form.formState.errors.items) && (<FormMessage>{form.formState.errors.items.message}</FormMessage>)}

            <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Due Date (Optional)</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal h-9",!field.value && "text-muted-foreground")}>
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date)} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus/>
                    </PopoverContent>
                  </Popover><FormMessage />
                </FormItem>)}
            />
            <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>General Order Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any special instructions" {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total:</span><span>${orderTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Button type="submit"
                  disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName) || isLoadingServices}
                  className="w-full">
                  {form.formState.isSubmitting ? "Creating..." :
                   isLoadingSpecificCustomer ? "Loading Customer..." :
                   (isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName && !customerIdFromQuery) ? "Loading List..." :
                   isLoadingServices ? "Loading Services..." :
                   !watchedCustomerId ? "Select Customer First" :
                   selectedCustomerName ? `Create & Proceed to Payment for ${selectedCustomerName.split(' ')[0]}`:
                   `Create & Proceed to Payment`}
                   <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button type="button" variant="outline"
                  onClick={handleCreateAndPayLater}
                  disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !selectedCustomerName) || isLoadingServices}
                  className="w-full">
                  {form.formState.isSubmitting ? "Creating..." : `Create & Pay Later`}
                  <Clock className="ml-2 h-4 w-4" />
                </Button>
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
    const numericAmountTendered = parseFloat(amountTendered) || 0;
    const changeDue = (selectedPaymentMethod === "Cash" && numericAmountTendered > numericTotalAmount)
      ? (numericAmountTendered - numericTotalAmount).toFixed(2)
      : null;

    return (
      <Card className="shadow-lg sticky top-6">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Order {createdOrderDetails.id}
          </CardTitle>
          <CardDescription>Total Amount: <strong>${numericTotalAmount.toFixed(2)}</strong></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activePaymentStep === "selectAction" && (
            <>
              <Button onClick={() => setActivePaymentStep("enterPaymentDetails")} className="w-full">
                <CheckCircle className="mr-2 h-5 w-5" /> Take Payment
              </Button>
              <Button variant="secondary" onClick={handlePayLaterAndNav} className="w-full">
                <Clock className="mr-2 h-5 w-5" /> Pay Later & View Order
              </Button>
            </>
          )}

          {activePaymentStep === "enterPaymentDetails" && (
            <div className="space-y-4">
              <div>
                <FormLabel htmlFor="amountTendered">Amount Tendered</FormLabel>
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsKeypadOpen(true)}>
                    <Input
                        id="amountTendered"
                        type="text" // Keep as text to display formatted value from keypad
                        value={selectedPaymentMethod === "On Account" ? numericTotalAmount.toFixed(2) : amountTendered}
                        readOnly
                        placeholder="Tap to enter amount"
                        className="cursor-pointer flex-grow"
                        disabled={selectedPaymentMethod === "On Account"}
                    />
                    <Grid className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant={selectedPaymentMethod === "Cash" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Cash"); setPaymentNote("");}}>
                  <Banknote className="mr-2 h-4 w-4"/> Cash
                </Button>
                <Button variant={selectedPaymentMethod === "Card" ? "default" : "outline"} onClick={() => { setSelectedPaymentMethod("Card"); setPaymentNote("");}}>
                  <WalletCards className="mr-2 h-4 w-4"/> Card
                </Button>
              </div>
               <Button variant={selectedPaymentMethod === "On Account" ? "default" : "outline"} onClick={handlePayOnAccount} className="w-full">
                <Archive className="mr-2 h-4 w-4" /> Pay on Account
              </Button>

              {paymentNote && <p className="text-sm text-muted-foreground">{paymentNote}</p>}

              {changeDue !== null && (
                <p className="text-md font-semibold">Change Due: ${changeDue}</p>
              )}

              <div className="space-y-2 border-t pt-4">
                <Button
                  onClick={handleConfirmPayment}
                  className="w-full"
                  disabled={!selectedPaymentMethod || (selectedPaymentMethod !== "On Account" && (!amountTendered || parseFloat(amountTendered) <=0 && numericTotalAmount > 0))}
                >
                  Confirm Payment
                </Button>
                <Button variant="ghost" onClick={() => setActivePaymentStep("selectAction")} className="w-full text-sm">
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {activePaymentStep === "selectAction" && (
            <CardFooter className="flex flex-col space-y-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCreateAnotherOrder} className="w-full">
                <ShoppingCart className="mr-2 h-5 w-5" /> Create Another Order
                </Button>
                <Button variant="ghost" onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
                </Button>
            </CardFooter>
        )}
      </Card>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <AlphanumericKeypadModal
        isOpen={isKeypadOpen}
        onOpenChange={setIsKeypadOpen}
        inputValue={amountTendered} // Bind to amountTendered
        onInputChange={setAmountTendered} // Update amountTendered directly
        onConfirm={handleAmountKeypadConfirm} // Use specific confirm handler
        title="Enter Amount Tendered"
      />
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Select Services for {isLoadingSpecificCustomer ? <Skeleton className="h-7 w-32 inline-block" /> : selectedCustomerName || 'Customer'}</CardTitle>
            <CardDescription>Choose a category, then click a service to add it to the order.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingServices ? (
              <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
            ) : serviceCategoryNames.length > 0 ? (
              <Tabs defaultValue={serviceCategoryNames[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 h-auto flex-wrap justify-start">
                  {serviceCategoryNames.map((category) => (<TabsTrigger key={category} value={category} className="text-sm px-3 py-2 h-auto">{category}</TabsTrigger>))}
                </TabsList>
                {serviceCategoryNames.map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1 border-t pt-4">
                      {servicesByCategory[category]?.map((service) => (
                        <Button key={service.id} variant="outline" className="h-auto p-3 flex flex-col items-start text-left justify-between min-h-[60px] shadow-sm hover:shadow-md transition-shadow border-border bg-background" onClick={() => handleServiceItemClick(service)}>
                          <span className="font-medium text-sm">{service.name}</span>
                          <span className="text-xs text-primary">${service.price.toFixed(2)}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p>No services available. Add items to your catalog in Settings.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        {stage === "form" && renderOrderFormCard()}
        {stage === "paymentOptions" && renderPaymentOptionsCard()}
      </div>
    </div>
  );
}
