"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnlineOrderPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-4">Place a New Order</h1>
      <p className="text-muted-foreground mb-8">Follow the steps below to schedule your cleaning service.</p>

      <div className="space-y-8">
        {/* Step 1: Service Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose Your Services</CardTitle>
            <CardDescription>Select the items you want us to clean.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              (Service selection component will go here. This will be similar to the POS order creation but adapted for online customers.)
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Schedule Collection & Delivery */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Step 2: Schedule Collection & Delivery</CardTitle>
            <CardDescription>Choose available time slots for pickup and delivery.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">(Calendar and time slot selection will go here.)</p>
          </CardContent>
        </Card>

        {/* Step 3: Review & Pay */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Step 3: Review & Pay</CardTitle>
            <CardDescription>Confirm your order details and complete payment.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">(Order summary and Stripe payment component will go here.)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
