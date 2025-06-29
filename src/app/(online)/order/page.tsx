
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getServices } from '@/lib/data';
import type { ServiceItem, CompanySettings, TimeSlot } from '@/types';
import { getCompanySettingsAction } from '@/app/(auth)/settings/company-settings-actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MinusCircle, ShoppingCart, Trash2, CalendarDays, ArrowRight, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format, isBefore, startOfToday } from 'date-fns';

interface CartItem extends ServiceItem {
  quantity: number;
}

interface ServicesByCategory {
  [category: string]: ServiceItem[];
}

type OrderStep = 'basket' | 'schedule';

const dayIndexToName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function OnlineOrderPage() {
  const { toast } = useToast();

  const [step, setStep] = useState<OrderStep>('basket');
  const [servicesByCategory, setServicesByCategory] = useState<ServicesByCategory>({});
  const [serviceCategoryNames, setServiceCategoryNames] = useState<string[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // State for scheduling
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [collectionDate, setCollectionDate] = useState<Date | undefined>();
  const [collectionSlot, setCollectionSlot] = useState<TimeSlot | undefined>();
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [deliverySlot, setDeliverySlot] = useState<TimeSlot | undefined>();

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

  useEffect(() => {
    async function fetchSettings() {
      setIsLoadingSettings(true);
      try {
        const companySettings = await getCompanySettingsAction();
        if (companySettings) {
          setSettings(companySettings);
        } else {
          toast({ title: "Scheduling Error", description: "Could not load scheduling options.", variant: "destructive" });
        }
      } catch (err) {
        console.error("Failed to fetch company settings:", err);
        toast({ title: "Error", description: "Could not load company settings. Please try again later.", variant: "destructive" });
      } finally {
        setIsLoadingSettings(false);
      }
    }
    fetchSettings();
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

  const isCollectionDayDisabled = (day: Date) => {
    if (isBefore(day, startOfToday())) return true;
    const dayName = dayIndexToName[day.getDay()];
    const schedule = settings?.available_collection_schedule?.[dayName];
    return !schedule || !schedule.is_active || schedule.slots.length === 0;
  };

  const isDeliveryDayDisabled = (day: Date) => {
    if (!collectionDate || isBefore(day, collectionDate)) return true;
    const dayName = dayIndexToName[day.getDay()];
    const schedule = settings?.available_delivery_schedule?.[dayName];
    return !schedule || !schedule.is_active || schedule.slots.length === 0;
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

  const renderScheduleStep = () => {
    const collectionDayName = collectionDate ? dayIndexToName[collectionDate.getDay()] : null;
    const collectionSlots = collectionDayName ? settings?.available_collection_schedule?.[collectionDayName]?.slots : [];

    const deliveryDayName = deliveryDate ? dayIndexToName[deliveryDate.getDay()] : null;
    const deliverySlots = deliveryDayName ? settings?.available_delivery_schedule?.[deliveryDayName]?.slots : [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Step 2: Schedule Collection & Delivery</CardTitle>
          <CardDescription>Choose your preferred dates and time slots based on our availability.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* Collection Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                1. Select Collection Slot
            </h3>
            {isLoadingSettings ? (
                <Skeleton className="h-64 w-full" />
            ) : (
                <Calendar
                    mode="single"
                    selected={collectionDate}
                    onSelect={(date) => {
                        setCollectionDate(date);
                        setCollectionSlot(undefined);
                        setDeliveryDate(undefined);
                        setDeliverySlot(undefined);
                    }}
                    disabled={isCollectionDayDisabled}
                    className="rounded-md border"
                />
            )}
            {collectionDate && (
                <div className="space-y-2">
                    <Label>Available Slots for {format(collectionDate, 'PPP')}:</Label>
                    {collectionSlots && collectionSlots.length > 0 ? (
                        <RadioGroup
                            value={collectionSlot?.id}
                            onValueChange={(slotId) => setCollectionSlot(collectionSlots.find(s => s.id === slotId))}
                        >
                            {collectionSlots.map(slot => (
                                <div key={slot.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={slot.id} id={`coll-${slot.id}`} />
                                    <Label htmlFor={`coll-${slot.id}`} className="font-normal flex items-center">
                                        <Clock className="mr-1.5 h-4 w-4 text-muted-foreground"/> {slot.time_range}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    ) : (
                        <p className="text-sm text-muted-foreground">No slots available for this day.</p>
                    )}
                </div>
            )}
          </div>

          {/* Delivery Column */}
          <div className="space-y-4">
            <h3 className={`font-semibold text-lg flex items-center ${!collectionSlot ? 'text-muted-foreground' : ''}`}>
                 <CalendarDays className="mr-2 h-5 w-5" />
                2. Select Delivery Slot
            </h3>
            {!collectionSlot ? (
                <div className="h-64 flex items-center justify-center border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">Please select a collection slot first.</p>
                </div>
            ) : isLoadingSettings ? (
                <Skeleton className="h-64 w-full" />
            ) : (
                <Calendar
                    mode="single"
                    selected={deliveryDate}
                    onSelect={(date) => {
                        setDeliveryDate(date);
                        setDeliverySlot(undefined);
                    }}
                    disabled={isDeliveryDayDisabled}
                    className="rounded-md border"
                />
            )}
            {deliveryDate && (
                <div className="space-y-2">
                    <Label>Available Slots for {format(deliveryDate, 'PPP')}:</Label>
                     {deliverySlots && deliverySlots.length > 0 ? (
                        <RadioGroup
                            value={deliverySlot?.id}
                            onValueChange={(slotId) => setDeliverySlot(deliverySlots.find(s => s.id === slotId))}
                        >
                            {deliverySlots.map(slot => (
                                <div key={slot.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={slot.id} id={`del-${slot.id}`} />
                                    <Label htmlFor={`del-${slot.id}`} className="font-normal flex items-center">
                                        <Clock className="mr-1.5 h-4 w-4 text-muted-foreground"/> {slot.time_range}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    ) : (
                        <p className="text-sm text-muted-foreground">No slots available for this day.</p>
                    )}
                </div>
            )}
          </div>
        </CardContent>
         <CardFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep('basket')}>Back to Basket</Button>
            <Button className="w-auto" disabled={!collectionSlot || !deliverySlot}>
                Proceed to Payment (Placeholder)
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
       </CardFooter>
      </Card>
    );
  };

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
                {step === 'basket' ? (
                    <Button onClick={handleProceedToSchedule} className="w-full">
                        Proceed to Scheduling
                        <CalendarDays className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                  <>
                    <Separator className="my-2" />
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Collection:</span>
                        <span className="font-medium text-right">{collectionSlot && collectionDate ? `${format(collectionDate, 'EEE, MMM d')} @ ${collectionSlot.time_range}` : 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery:</span>
                        <span className="font-medium text-right">{deliverySlot && deliveryDate ? `${format(deliveryDate, 'EEE, MMM d')} @ ${deliverySlot.time_range}` : 'Not selected'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground pt-4">Complete scheduling options on the left.</p>
                  </>
                )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
