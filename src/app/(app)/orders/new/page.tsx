
"use client";

import *ాలుReact from "react";
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
import { mockCustomers, mockServices } from "@/lib/data";
import type { ServiceItem } from "@/types";
import { CreateOrderSchema, type CreateOrderInput } from "./order.schema";
import { createOrderAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Trash2, CalendarIcon, ShoppingCart, CheckCircle, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderCreationStage = "form" | "paymentOptions";

export default function NewOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [stage, setStage] = React.useState<OrderCreationStage>("form");
  const [createdOrderDetails, setCreatedOrderDetails] = React.useState<{ id: string; message: string } | null>(null);

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customerId: "",
      items: [],
      dueDate: undefined,
      notes: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const servicesByCategory = React.useMemo(() => {
    return mockServices.reduce((acc, service) => {
      const category = service.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as ServicesByCategory);
  }, []);

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
    const result = await createOrderAction(data);
    if (result.success && result.orderId) {
      toast({
        title: "Order Created",
        description: result.message,
      });
      setCreatedOrderDetails({ id: result.orderId, message: result.message || "Order created successfully!" });
      setStage("paymentOptions");
      // Don't reset form here, do it when user chooses an action
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
  };

  const handlePayNow = () => {
    if (!createdOrderDetails) return;
    toast({
      title: "Payment Processed (Mocked)",
      description: `Order ${createdOrderDetails.id} marked as paid.`,
    });
    router.push(`/orders/${createdOrderDetails.id}`);
    resetFormAndStage();
  };

  const handlePayLater = () => {
    if (!createdOrderDetails) return;
    router.push(`/orders/${createdOrderDetails.id}`);
    resetFormAndStage();
  };

  const handleCreateAnotherOrder = () => {
    resetFormAndStage();
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
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Button onClick={handlePayNow} className="w-full sm:w-auto">
              <CheckCircle className="mr-2 h-4 w-4" /> Pay Now
            </Button>
            <Button onClick={handlePayLater} variant="outline" className="w-full sm:w-auto">
              <Clock className="mr-2 h-4 w-4" /> Pay Later
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleCreateAnotherOrder} variant="link">
            Create Another Order
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Select Services</CardTitle>
            <CardDescription>Choose services by category. Click a service to add it to the order.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full space-y-2" defaultValue={Object.keys(servicesByCategory)}>
              {Object.entries(servicesByCategory).map(([category, servicesInCat]) => (
                <AccordionItem value={category} key={category} className="border bg-muted/20 rounded-md">
                  <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                    {category}
                  </AccordionTrigger>
                  <AccordionContent className="p-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3">
                      {servicesInCat.map((service) => (
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.phone || 'No phone'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                format(field.value, "PPP")
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
                            selected={field.value}
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
                    <Button type="submit" disabled={form.formState.isSubmitting || fields.length === 0} className="w-full">
                    {form.formState.isSubmitting ? "Creating Order..." : "Create Order"}
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

    