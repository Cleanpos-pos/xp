
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
import { Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock, CreditCard, ArrowRight, Archive } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderCreationStage = "form" | "paymentOptions";

export default function NewOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = React.useState<OrderCreationStage>("form");
  const [createdOrderDetails, setCreatedOrderDetails] = React.useState<{ id: string; message: string; totalAmount: number } | null>(null);

  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [isLoadingAllCustomers, setIsLoadingAllCustomers] = React.useState(false);
  const [isLoadingSpecificCustomer, setIsLoadingSpecificCustomer] = React.useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = React.useState<string | null>(null);

  const [allServices, setAllServices] = React.useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [servicesByCategory, setServicesByCategory] = React.useState<ServicesByCategory>({});
  const [serviceCategoryNames, setServiceCategoryNames] = React.useState<string[]>([]);

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customerId: "",
      items: [],
      dueDate: undefined,
      notes: "",
    },
  });

  const customerIdFromQuery = searchParams.get('customerId')?.trim();

  React.useEffect(() => {
    if (!customerIdFromQuery) {
      setIsLoadingAllCustomers(true);
      getCustomers()
        .then(data => setAllCustomers(data))
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
              description: `Failed to load customer (ID: ${customerIdFromQuery}). Select manually or go back. Check server logs from 'getCustomerById' for details (RLS/existence).`,
              variant: "warning",
              duration: 15000
            });
            form.setValue('customerId', ''); // Clear if not found
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
          form.setValue('customerId', ''); // Clear on error
          setSelectedCustomerName(null);
        })
        .finally(() => setIsLoadingSpecificCustomer(false));
    } else {
      setIsLoadingSpecificCustomer(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdFromQuery, toast]); // form.setValue removed from deps

  const watchedCustomerId = form.watch("customerId");

  React.useEffect(() => {
    if (isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId && !customerIdFromQuery)) {
      return;
    }
    if (watchedCustomerId) {
      if (customerIdFromQuery && watchedCustomerId === customerIdFromQuery) {
        // Name should be set by specific customer load. If not, find from allCustomers if available (fallback).
        if (!selectedCustomerName) {
            const customer = allCustomers.find(c => c.id === watchedCustomerId);
            if (customer) setSelectedCustomerName(customer.name);
        }
      } else {
        // Customer selected from dropdown
        const customer = allCustomers.find(c => c.id === watchedCustomerId);
        setSelectedCustomerName(customer ? customer.name : null);
      }
    } else {
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
      resetFormAndStage(); // Reset for next potential order
      router.push('/find-or-add-customer'); // Then redirect to start new flow
    } else {
      toast({
        title: "Error Creating Order",
        description: result.errors ? JSON.stringify(result.errors) : "Failed to create order.",
        variant: "destructive",
      });
    }
  }

  const handleConfirmMockPayment = () => {
    if (!createdOrderDetails) return;
    toast({ title: "Payment Processed (Mocked)", description: `Payment for order ${createdOrderDetails.id} of $${createdOrderDetails.totalAmount.toFixed(2)} was successful.` });
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
                            selectedCustomerName ? selectedCustomerName :
                            (isLoadingAllCustomers && !watchedCustomerId ? "Loading customer list..." : "Select a customer")
                          }>
                           {selectedCustomerName || (field.value && "Selected...")}
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
                  disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId) || isLoadingServices}
                  className="w-full">
                  {form.formState.isSubmitting ? "Creating..." : 
                   isLoadingSpecificCustomer ? "Loading Customer..." :
                   isLoadingAllCustomers && !watchedCustomerId && !customerIdFromQuery ? "Loading List..." :
                   isLoadingServices ? "Loading Services..." :
                   !watchedCustomerId ? "Select Customer First" :
                   `Create & Proceed to Payment`}
                   <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button type="button" variant="outline"
                  onClick={handleCreateAndPayLater}
                  disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingSpecificCustomer || (isLoadingAllCustomers && !watchedCustomerId) || isLoadingServices}
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

  const renderPaymentOptionsCard = () => (
    <Card className="shadow-lg sticky top-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <CreditCard className="mr-2 h-6 w-6 text-primary" /> Order Created: Next Steps
        </CardTitle>
        <CardDescription>Order <strong>{createdOrderDetails?.id}</strong> for <strong>${createdOrderDetails?.totalAmount.toFixed(2)}</strong> has been created.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleConfirmMockPayment} className="w-full">
          <CheckCircle className="mr-2 h-5 w-5" /> Confirm Mock Payment (Full Amount)
        </Button>
        <Button variant="secondary" onClick={handlePayLaterAndNav} className="w-full">
          <Clock className="mr-2 h-5 w-5" /> Pay Later & View Order
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 pt-4 border-t">
         <Button variant="outline" onClick={handleCreateAnotherOrder} className="w-full">
          <ShoppingCart className="mr-2 h-5 w-5" /> Create Another Order
        </Button>
        <Button variant="ghost" onClick={handleGoToDashboard} className="w-full">
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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

    