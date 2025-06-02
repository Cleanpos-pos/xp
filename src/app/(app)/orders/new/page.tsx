
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
import { Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock, CreditCard, ArrowRight, Archive, Grid, Banknote, WalletCards, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

  // Print dialog states
  const [showPrintDialog, setShowPrintDialog] = React.useState(false);
  const [printType, setPrintType] = React.useState<string | null>(null);


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
        })
        .catch(err => {
          console.error("[NewOrderPage] Failed to fetch customers:", err);
          toast({ title: "Error", description: "Could not load customer list.", variant: "destructive" });
        })
        .finally(() => setIsLoadingAllCustomers(false));
    } else {
      setAllCustomers([]);
      setIsLoadingAllCustomers(false);
    }
  }, [customerIdFromQuery, toast]);

  React.useEffect(() => {
    if (customerIdFromQuery) {
      setIsLoadingSpecificCustomer(true);
      setSelectedCustomerName(null);
      form.setValue('customerId', '');

      getCustomerById(customerIdFromQuery)
        .then(customer => {
          if (customer) {
            form.setValue('customerId', customer.id, { shouldValidate: true });
            setSelectedCustomerName(customer.name);
          } else {
            toast({
              title: "Customer Not Loaded",
              description: `Failed to load customer (ID: ${customerIdFromQuery}). Select manually or go back.`,
              variant: "warning",
              duration: 15000
            });
            form.setValue('customerId', '');
            setSelectedCustomerName(null);
          }
        })
        .catch(err => {
          console.error("[NewOrderPage] Error fetching pre-selected customer by ID from URL:", err);
          toast({
            title: "Error Loading Customer by ID",
            description: `Could not load details for the pre-selected customer (ID: '${customerIdFromQuery}'). Error: ${err.message || 'Unknown error'}. Please try selecting manually.`,
            variant: "destructive",
            duration: 15000
          });
          form.setValue('customerId', '');
          setSelectedCustomerName(null);
        })
        .finally(() => setIsLoadingSpecificCustomer(false));
    } else {
      setIsLoadingSpecificCustomer(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdFromQuery, toast]);

  const watchedCustomerId = form.watch("customerId");

  React.useEffect(() => {
    if (isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !customerIdFromQuery)) {
      return;
    }

    if (watchedCustomerId) {
      if (customerIdFromQuery && watchedCustomerId === customerIdFromQuery) {
        // If it's the pre-selected customer, their name should already be set or is being set by the effect above.
        // If allCustomers has data (e.g. from a previous non-ID load), we can try to find name, but prioritize specific load.
        if (!selectedCustomerName && allCustomers.length > 0) {
           const customer = allCustomers.find(c => c.id === watchedCustomerId);
           if (customer) setSelectedCustomerName(customer.name);
        }
      } else { // Customer selected manually from dropdown
        const customer = allCustomers.find(c => c.id === watchedCustomerId);
        if (customer) {
          setSelectedCustomerName(customer.name);
        } else if (!customerIdFromQuery) { // Only clear if no customerId was from query (avoid race with specific load)
          setSelectedCustomerName(null);
        }
      }
    } else { // No customerId watched (e.g. form reset or initial state without query)
      if (!customerIdFromQuery) { // Don't clear if a query ID is present and specific load might be pending
        setSelectedCustomerName(null);
      }
    }
  }, [watchedCustomerId, allCustomers, customerIdFromQuery, isLoadingAllCustomers, isLoadingSpecificCustomer, selectedCustomerName]);


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
    // setSelectedCustomerName(null); // Keep if customerIdFromQuery is present
    setActivePaymentStep("selectAction");
    setAmountTendered("");
    setSelectedPaymentMethod(null);
    setIsKeypadOpen(false);
    setPaymentNote("");
    setShowPrintDialog(false);
    setPrintType(null);

    if (!searchParams.get('customerId')) {
        setSelectedCustomerName(null); // Clear name only if not from query
        setIsLoadingAllCustomers(true);
        getCustomers().then(data => setAllCustomers(data))
        .catch(() => {})
        .finally(() => setIsLoadingAllCustomers(false));
    } else {
      // If customerIdFromQuery exists, the effect for loading specific customer will run
      // and potentially re-set selectedCustomerName
    }
  }, [form, searchParams]);

  async function proceedToPaymentSubmit(data: CreateOrderInput) {
    const result = await createOrderAction(data);
    if (result.success && result.orderId) {
      toast({ title: "Order Created", description: result.message });
      setCreatedOrderDetails({ id: result.orderId, message: result.message || "Order created!", totalAmount: orderTotal });
      setStage("paymentOptions");
      setActivePaymentStep("selectAction");
      setAmountTendered(orderTotal.toFixed(2));
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
      if(paymentNote) paymentDetailsMessage += ` Note: ${paymentNote}`;
    } else if (selectedPaymentMethod === "Cash" || selectedPaymentMethod === "Card") {
      const paymentType = selectedPaymentMethod === "Cash" ? "Cash" : "Card";
      let paymentSummary = `Paid ${numericAmountTendered.toFixed(2)} by ${paymentType}.`;
      if (numericAmountTendered < createdOrderDetails.totalAmount) {
        paymentSummary += ` (Partial Payment - $${(createdOrderDetails.totalAmount - numericAmountTendered).toFixed(2)} remaining).`;
      } else if (numericAmountTendered > createdOrderDetails.totalAmount && selectedPaymentMethod === "Cash") {
        paymentSummary += ` Change: $${(numericAmountTendered - createdOrderDetails.totalAmount).toFixed(2)}.`;
      }
      paymentDetailsMessage = `Payment for order ${createdOrderDetails.id}: ${paymentSummary}`;
      if(paymentNote) paymentDetailsMessage += ` Note: ${paymentNote}`;
    } else {
       paymentDetailsMessage = `Order ${createdOrderDetails.id} processed. No payment method selected or amount tendered.`;
       if(paymentNote) paymentDetailsMessage += ` Note: ${paymentNote}`;
    }

    toast({ title: "Payment Processed (Mocked)", description: paymentDetailsMessage });
    setPrintType(null); 
    setShowPrintDialog(true);
  };

  const handlePrintSelection = (selectedType: string) => {
    setPrintType(selectedType);
    setShowPrintDialog(false);
    if (createdOrderDetails) {
      router.push(`/orders/${createdOrderDetails.id}?autoprint=true&printType=${selectedType}`);
      resetFormAndStage();
    }
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
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        setAmountTendered(createdOrderDetails?.totalAmount.toFixed(2) || "0.00");
        toast({title: "Invalid Amount", description: "Please enter a valid numeric amount.", variant: "destructive"});
    }
  };

  const handlePayOnAccount = () => {
    setSelectedPaymentMethod("On Account");
    setAmountTendered(createdOrderDetails?.totalAmount.toFixed(2) || "0.00");
    setPaymentNote(`Order total of $${createdOrderDetails?.totalAmount.toFixed(2)} will be charged to customer account.`);
  };

  const handleOpenAmountKeypad = React.useCallback(() => {
    if (selectedPaymentMethod !== "On Account") {
      setIsKeypadOpen(true);
    }
  }, [selectedPaymentMethod, setIsKeypadOpen]);


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
                  <div className="text-sm font-medium mb-1">Customer</div>
                  {(isLoadingAllCustomers && !customerIdFromQuery && !selectedCustomerName && !field.value) || (isLoadingSpecificCustomer && !selectedCustomerName && customerIdFromQuery) ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const customer = allCustomers.find(c => c.id === value);
                      setSelectedCustomerName(customer ? customer.name : null);
                    }}
                    value={field.value}
                    disabled={!!customerIdFromQuery || isLoadingAllCustomers || isLoadingSpecificCustomer}
                  >
                    <FormControl>
                       <SelectTrigger>
                        <SelectValue placeholder={
                            isLoadingSpecificCustomer ? "Loading customer..." :
                            (isLoadingAllCustomers && !field.value && !customerIdFromQuery) ? "Loading list..." :
                            "Select a customer"
                          }>
                           {selectedCustomerName || (field.value && !isLoadingSpecificCustomer && !selectedCustomerName && "Select a customer")}
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
                       : customerIdFromQuery && selectedCustomerName ? `Selected: ${selectedCustomerName}. To change, go back and re-select.`
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
                  {form.formState.isSubmitting ? "Creating..." : `Create Order & Pay Later`}
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
                <div className="text-sm font-medium mb-1">Amount Tendered</div>
                <div className="flex items-center space-x-2 cursor-pointer" onClick={handleOpenAmountKeypad}>
                    <Input
                        id="amountTenderedInput"
                        type="text"
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
                  Confirm Payment & Print Options
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
        inputValue={amountTendered}
        onInputChange={setAmountTendered}
        onConfirm={handleAmountKeypadConfirm}
        title="Enter Amount Tendered"
      />
      {createdOrderDetails && (
        <Dialog open={showPrintDialog} onOpenChange={(isOpen) => {
            setShowPrintDialog(isOpen);
            if (!isOpen && !printType && createdOrderDetails) { 
              router.push(`/orders/${createdOrderDetails.id}`);
              resetFormAndStage();
            }
          }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center"><Printer className="mr-2 h-5 w-5"/>Print Options for Order {createdOrderDetails.id}</DialogTitle>
              <DialogDescription>
                Select a receipt type to print. The print dialog will open after navigating to the order details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button onClick={() => handlePrintSelection('customer_copy')}>Customer Copy</Button>
              <Button onClick={() => handlePrintSelection('shop_copy')}>Shop Copy</Button>
              <Button onClick={() => handlePrintSelection('stubs')}>Print Stubs</Button>
              <Button onClick={() => handlePrintSelection('all_tickets')}>All Tickets</Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowPrintDialog(false);
                setPrintType(null);
                router.push(`/orders/${createdOrderDetails.id}`);
                resetFormAndStage();
              }}>
                Skip Printing & View Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
