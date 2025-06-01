
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getCustomers, getCustomerById, getMockServices } from "@/lib/data"; // getCustomers and getCustomerById are now async
import type { ServiceItem, Customer } from "@/types";
import { CreateOrderSchema, type CreateOrderInput } from "./order.schema";
import { createOrderAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock, CreditCard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderCreationStage = "form" | "paymentOptions" | "paymentProcessing";

export default function NewOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = React.useState<OrderCreationStage>("form");
  const [createdOrderDetails, setCreatedOrderDetails] = React.useState<{ id: string; message: string; totalAmount: number } | null>(null);
  
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = React.useState(true);
  const [selectedCustomerName, setSelectedCustomerName] = React.useState<string | null>(null);


  const allServices = React.useMemo(() => getMockServices(), []); // Services are still mock

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customerId: "",
      items: [],
      dueDate: undefined,
      notes: "",
    },
  });

  // Fetch all customers for the dropdown if no specific customer is pre-selected
  React.useEffect(() => {
    const customerIdFromQuery = searchParams.get('customerId');
    if (!customerIdFromQuery) { // Only fetch all if no customer is pre-selected
      setIsLoadingCustomers(true);
      getCustomers()
        .then(data => {
          setAllCustomers(data);
          setIsLoadingCustomers(false);
        })
        .catch(err => {
          console.error("Failed to fetch customers:", err);
          toast({ title: "Error", description: "Could not load customer list.", variant: "destructive" });
          setIsLoadingCustomers(false);
        });
    } else {
      setIsLoadingCustomers(false); // Not loading all customers if one is specified
    }
  }, [searchParams, toast]);


  // Effect to handle pre-selected customer from query params
  React.useEffect(() => {
    const customerIdFromQuery = searchParams.get('customerId');
    if (customerIdFromQuery) {
      setIsLoadingCustomers(true); // Indicate loading for this specific customer
      getCustomerById(customerIdFromQuery)
        .then(customer => {
          if (customer) {
            form.setValue('customerId', customerIdFromQuery, { shouldValidate: true });
            setSelectedCustomerName(customer.name);
          } else {
            console.warn(`Customer ID ${customerIdFromQuery} from query params not found.`);
            toast({title: "Customer Not Found", description: "The pre-selected customer was not found. Please select a customer.", variant: "destructive"});
            form.setValue('customerId', '');
            setSelectedCustomerName(null);
            router.replace('/orders/new', undefined); // Clear query param if customer not found
          }
        })
        .catch(err => {
          console.error("Failed to fetch customer by ID:", err);
          toast({title: "Error", description: "Could not load the pre-selected customer.", variant: "destructive"});
          form.setValue('customerId', '');
          setSelectedCustomerName(null);
          router.replace('/orders/new', undefined);
        })
        .finally(() => {
          setIsLoadingCustomers(false);
        });
    } else {
      // Ensure customerId and name are cleared if query param is removed/not present
      if (form.getValues('customerId')) {
          form.setValue('customerId', '');
      }
      if (selectedCustomerName) {
          setSelectedCustomerName(null);
      }
    }
  }, [searchParams, form, toast, router, selectedCustomerName]);

  const watchedCustomerId = form.watch("customerId");

  // Effect to update selectedCustomerName if customerId changes via dropdown
  React.useEffect(() => {
    if (watchedCustomerId && !searchParams.get('customerId')) { // Only if not pre-selected
      const customer = allCustomers.find(c => c.id === watchedCustomerId);
      if (customer && customer.name !== selectedCustomerName) {
        setSelectedCustomerName(customer.name);
      } else if (!customer && watchedCustomerId) { // If ID is set but not in list (shouldn't happen)
        setSelectedCustomerName(null); 
      }
    } else if (!watchedCustomerId && !searchParams.get('customerId')) { // Cleared or no selection
        setSelectedCustomerName(null);
    }
    // Do not clear if customerId is from query param, that's handled by the other useEffect
  }, [watchedCustomerId, allCustomers, selectedCustomerName, searchParams]);


  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const servicesByCategory = React.useMemo(() => {
    return allServices.reduce((acc, service) => {
      const category = service.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as ServicesByCategory);
  }, [allServices]);

  const handleServiceItemClick = (service: ServiceItem) => {
    const currentItems = form.getValues("items");
    const existingItemIndex = currentItems.findIndex(
      (item) => item.serviceItemId === service.id
    );

    if (existingItemIndex > -1) {
      const existingItem = currentItems[existingItemIndex];
      update(existingItemIndex, {
        ...existingItem,
        quantity: existingItem.quantity + 1,
      });
    } else {
      append({
        serviceItemId: service.id,
        serviceName: service.name,
        unitPrice: service.price,
        quantity: 1,
        notes: "",
      });
    }
  };

  const watchedItems = form.watch("items");
  
  const orderTotal = React.useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);
  }, [watchedItems]);

  async function onSubmit(data: CreateOrderInput) {
    const result = await createOrderAction(data); // This is mock, needs Supabase later
    if (result.success && result.orderId) {
      toast({
        title: "Order Created",
        description: result.message,
      });
      setCreatedOrderDetails({
        id: result.orderId,
        message: result.message || "Order created successfully!",
        totalAmount: orderTotal
      });
      setStage("paymentOptions");
    } else {
      toast({
        title: "Error",
        description: result.errors ? JSON.stringify(result.errors) : "Failed to create order. Please check the form or ensure at least one item is added.",
        variant: "destructive",
      });
      console.error("Form submission errors:", result.errors);
    }
  }

  const resetFormAndStage = () => {
    form.reset({
      customerId: "",
      items: [],
      dueDate: undefined,
      notes: "",
    });
    setStage("form");
    setCreatedOrderDetails(null);
    setSelectedCustomerName(null);
    router.replace('/orders/new', undefined); 
    // Re-fetch all customers for dropdown if we are clearing a pre-selection
    if (!searchParams.get('customerId')) {
        setIsLoadingCustomers(true);
        getCustomers().then(data => {
            setAllCustomers(data);
            setIsLoadingCustomers(false);
        }).catch(() => setIsLoadingCustomers(false));
    }
  };

  const handleProceedToPayment = () => {
    if (!createdOrderDetails) return;
    setStage("paymentProcessing");
  };

  const handleConfirmMockPayment = () => {
    if (!createdOrderDetails) return;
    toast({
      title: "Payment Processed (Mocked)",
      description: `Payment for order ${createdOrderDetails.id} of $${createdOrderDetails.totalAmount.toFixed(2)} was successful.`,
    });
    router.push(`/orders/${createdOrderDetails.id}`); // Order details page still uses mock order
    resetFormAndStage();
  }

  const handlePayLater = () => {
    if (!createdOrderDetails) return;
    router.push(`/orders/${createdOrderDetails.id}`); // Order details page still uses mock order
    resetFormAndStage();
  };

  const handleCreateAnotherOrder = () => {
    resetFormAndStage();
    router.push('/find-or-add-customer');
  };
  
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };


  if (stage === "paymentOptions" && createdOrderDetails) {
    return (
      <Card className="max-w-md mx-auto shadow-lg text-center">
        <CardHeader>
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <CardTitle className="font-headline text-2xl mt-4">Order Successfully Created!</CardTitle>
          <CardDescription>{createdOrderDetails.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Order ID: {createdOrderDetails.id}</p>
          <p className="font-semibold text-lg">Total: ${createdOrderDetails.totalAmount.toFixed(2)}</p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Button onClick={handleProceedToPayment} className="w-full sm:w-auto">
              <CreditCard className="mr-2 h-4 w-4" /> Pay Now
            </Button>
            <Button onClick={handlePayLater} variant="outline" className="w-full sm:w-auto">
              <Clock className="mr-2 h-4 w-4" /> Pay Later
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-2 items-center">
          <Button onClick={handleCreateAnotherOrder} variant="link">
            Create Another Order
          </Button>
          <Button onClick={handleGoToDashboard} variant="link" size="sm">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (stage === "paymentProcessing" && createdOrderDetails) {
    return (
      <Card className="max-w-lg mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <CreditCard className="mr-2 h-6 w-6" /> Process Payment
          </CardTitle>
          <CardDescription>
            Order ID: {createdOrderDetails.id} - Total: ${createdOrderDetails.totalAmount.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumberMock">Card Number</Label>
              <Input id="cardNumberMock" type="text" placeholder="•••• •••• •••• ••••" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDateMock">Expiry Date (MM/YY)</Label>
                <Input id="expiryDateMock" type="text" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvvMock">CVV</Label>
                <Input id="cvvMock" type="text" placeholder="•••" />
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-end">
            <Button onClick={handleConfirmMockPayment} className="w-full sm:w-auto">
              Confirm Mock Payment
            </Button>
            <Button onClick={handlePayLater} variant="outline" className="w-full sm:w-auto">
              Cancel & Pay Later
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This is a simulated payment screen. No actual payment will be processed.
          </p>
        </CardContent>
      </Card>
    );
  }


  const categoryNames = Object.keys(servicesByCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Select Services for {isLoadingCustomers && searchParams.get('customerId') ? <Skeleton className="h-7 w-32 inline-block" /> : selectedCustomerName || 'Customer'}</CardTitle>
            <CardDescription>Choose a category, then click a service to add it to the order.</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryNames.length > 0 ? (
              <Tabs defaultValue={categoryNames[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 h-auto flex-wrap justify-start">
                  {categoryNames.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-sm px-3 py-2 h-auto">
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categoryNames.map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1 border-t pt-4">
                      {servicesByCategory[category].map((service) => (
                        <Button
                          key={service.id}
                          variant="outline"
                          className="h-auto p-3 flex flex-col items-start text-left justify-between min-h-[60px] shadow-sm hover:shadow-md transition-shadow border-border bg-background"
                          onClick={() => handleServiceItemClick(service)}
                        >
                          <span className="font-medium text-sm">{service.name}</span>
                          <span className="text-xs text-primary">${service.price.toFixed(2)}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p>No services available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg sticky top-6">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center">
              <ShoppingCart className="mr-2 h-6 w-6" /> Current Order
            </CardTitle>
            {fields.length === 0 && (
              <CardDescription>Select services to add them here.</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      {isLoadingCustomers && !searchParams.get('customerId') ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!!searchParams.get('customerId') || isLoadingCustomers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
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
                        {searchParams.get('customerId') && selectedCustomerName
                          ? `Selected: ${selectedCustomerName}. To change, go back.`
                          : isLoadingCustomers && !searchParams.get('customerId')
                          ? 'Loading customer list...'
                          : !searchParams.get('customerId') && !watchedCustomerId 
                          ? 'Select a customer for this order.'
                          : ''}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.length > 0 && (
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-3 space-y-3 bg-background border rounded-md shadow-sm">
                        <div>
                          <h4 className="font-medium text-sm">{watchedItems[index]?.serviceName}</h4>
                          <p className="text-xs text-muted-foreground">
                            Price: ${watchedItems[index]?.unitPrice?.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-end gap-3">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field: itemField }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Qty</FormLabel>
                                <FormControl>
                                  <Input type="number" {...itemField} min="1" className="h-9"/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove Item</span>
                            </Button>
                        </div>
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Item Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="e.g., Heavy starch" {...itemField} rows={1} className="text-xs"/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Card>
                    ))}
                  </div>
                )}

                {form.formState.errors.items && !form.formState.errors.items.root && !Array.isArray(form.formState.errors.items) && (
                    <FormMessage>{form.formState.errors.items.message}</FormMessage>
                )}

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal h-9",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP") // Ensure field.value is converted to Date
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date)}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Order Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any special instructions" {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Total:</span>
                        <span>${orderTotal.toFixed(2)}</span>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={form.formState.isSubmitting || fields.length === 0 || !watchedCustomerId || isLoadingCustomers} 
                      className="w-full"
                    >
                      {form.formState.isSubmitting
                        ? "Creating Order..."
                        : isLoadingCustomers && watchedCustomerId // Show loading if specific customer is being fetched
                        ? "Loading Customer..."
                        : watchedCustomerId && selectedCustomerName
                        ? `Create Order for ${selectedCustomerName}`
                        : "Select Customer First"}
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
