
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getServices } from '@/lib/data';
import type { ServiceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MinusCircle, ShoppingCart, Trash2, CalendarDays, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CartItem extends ServiceItem {
  quantity: number;
}

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderStep = 'basket' | 'schedule';

export default function OnlineOrderPage() {
  const { toast } = useToast();

  const [step, setStep] = useState<OrderStep>('basket');
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({});
  const [serviceCategoryNames, setServiceCategoryNames] = useState<string[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    async function fetchServicesData() {
      setIsLoadingServices(true);
      try {
        const servicesData = await getServices();
        const groupedServices = servicesData.reduce((acc, service) => {
          const category = service.category || "Other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(service);
          return acc;
        }, {} as ServicesByCategory);
        setServicesByCategory(groupedServices);
        setServiceCategoryNames(Object.keys(groupedServices));
      } catch (err) {
        console.error("Failed to fetch services:", err);
        toast({ title: "Error", description: "Could not load our services. Please try again later.", variant: "destructive" });
      } finally {
        setIsLoadingServices(false);
      }
    }
    fetchServicesData();
  }, [toast]);

  const handleAddToCart = (service: ServiceItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...service, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== serviceId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === serviceId ? { ...item, quantity } : item
        )
      );
    }
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const handleProceedToSchedule = () => {
    if (cart.length === 0) {
        toast({
            title: "Your basket is empty",
            description: "Please add at least one item to proceed.",
            variant: "default",
        });
        return;
    }
    setStep('schedule');
  };

  const renderBasketStep = () => (
     <Card>
        <CardHeader>
        <CardTitle className="text-2xl font-headline">Step 1: Choose Your Services</CardTitle>
        <CardDescription>Select the items you want us to clean. Click an item to add it to your basket.</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoadingServices ? (
            <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            </div>
        ) : serviceCategoryNames.length > 0 ? (
            <Tabs defaultValue={serviceCategoryNames[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 h-auto flex-wrap justify-start">
                {serviceCategoryNames.map(category => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                ))}
            </TabsList>
            {serviceCategoryNames.map(category => (
                <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t pt-4">
                    {servicesByCategory[category]?.map(service => (
                    <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleAddToCart(service)}>
                        <CardHeader className="p-4">
                        <CardTitle className="text-base">{service.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                        <p className="text-sm text-primary font-semibold">${service.price.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    ))}
                </div>
                </TabsContent>
            ))}
            </Tabs>
        ) : (
            <p className="text-center py-8 text-muted-foreground">No services are currently available online. Please check back later.</p>
        )}
        </CardContent>
    </Card>
  );

  const renderScheduleStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Step 2: Schedule Collection & Delivery</CardTitle>
        <CardDescription>Choose your preferred dates based on our availability. Final confirmation will be sent via email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Collection Date</h3>
          <p className="text-muted-foreground">Calendar placeholder: The interactive calendar will be implemented here, showing available collection days.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Delivery Date</h3>
          <p className="text-muted-foreground">Calendar placeholder: The interactive calendar for delivery will appear here after you select a collection date.</p>
        </div>
        <Button variant="outline" onClick={() => setStep('basket')}>Back to Basket</Button>
      </CardContent>
       <CardFooter>
            <Button className="w-full" disabled>
                Proceed to Payment (Placeholder)
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
       </CardFooter>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Content Area */}
      <div className="lg:col-span-2">
        {step === 'basket' && renderBasketStep()}
        {step === 'schedule' && renderScheduleStep()}
      </div>

      {/* Cart Summary */}
      <div className="lg:col-span-1 sticky top-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><ShoppingCart className="mr-2 h-6 w-6"/> Your Basket</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your basket is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={step === 'schedule'}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={step === 'schedule'}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleUpdateQuantity(item.id, 0)} disabled={step === 'schedule'}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex-col items-stretch space-y-4 pt-4 border-t">
              <div className="flex justify-between font-semibold text-lg">
                <span>Subtotal:</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
                {step === 'basket' && (
                    <Button onClick={handleProceedToSchedule} className="w-full">
                        Proceed to Scheduling
                        <CalendarDays className="ml-2 h-4 w-4" />
                    </Button>
                )}
                {step === 'schedule' && (
                    <p className="text-sm text-center text-muted-foreground">Complete scheduling options on the left.</p>
                )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
