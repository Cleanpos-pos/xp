
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Star, ArrowRight, RefreshCw } from "lucide-react";

// Mock data - in a real app, this would come from your backend/Stripe
type SubscriptionPlan = "Free" | "Pro" | "Enterprise";
interface UserSubscription {
  plan: SubscriptionPlan;
  status: "active" | "inactive" | "past_due" | "canceled";
  nextBillingDate?: string;
  trialEndsAt?: string;
}

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  // Mock current subscription. Replace with actual data fetching.
  const [subscription, setSubscription] = useState<UserSubscription>({
    plan: "Free",
    status: "active",
    nextBillingDate: "N/A",
  });

  // Mock available plans. Replace with actual data from your backend/Stripe.
  const availablePlans = [
    {
      id: "free_plan",
      name: "Free Plan",
      price: "$0/month",
      features: ["Basic access to core features", "Limited usage", "Community support"],
      isCurrent: subscription.plan === "Free",
    },
    {
      id: "pro_plan",
      name: "Pro Plan",
      price: "$29/month",
      features: ["Full access to all features", "Increased usage limits", "Priority email support", "Advanced analytics"],
      isCurrent: subscription.plan === "Pro",
    },
    {
      id: "enterprise_plan",
      name: "Enterprise Plan",
      price: "Contact Us",
      features: ["Custom features & integrations", "Dedicated account manager", "Premium SLA", "Volume discounts"],
      isCurrent: subscription.plan === "Enterprise",
    },
  ];

  const handleManageSubscription = () => {
    setIsLoading(true);
    // In a real app, this would redirect to your Stripe Customer Portal
    // or trigger a modal for plan changes.
    toast({
      title: "Managing Subscription...",
      description: "This would typically redirect to Stripe or a payment provider.",
    });
    setTimeout(() => {
      setIsLoading(false);
      // Example: Simulate a plan change or portal redirect
      // For now, just a placeholder action
      window.open("https://stripe.com/payments/customer-portal", "_blank");
    }, 2000);
  };

  const toast = (options: { title: string, description?: string, variant?: "default" | "destructive" }) => {
    // This is a mock toast function. Integrate with your actual useToast hook if available.
    console.log(`Toast: ${options.title} - ${options.description}`);
    alert(`${options.title}\n${options.description || ''}`);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Manage Your Subscription</CardTitle>
          <CardDescription>View your current plan details and manage your subscription settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-2">Current Plan: <Badge variant={subscription.status === "active" ? "default" : "destructive"}>{subscription.plan}</Badge></h3>
            <p className="text-sm text-muted-foreground">
              Status: <span className={subscription.status === "active" ? "text-green-600" : "text-red-600"}>{subscription.status}</span>
            </p>
            {subscription.plan !== "Free" && subscription.nextBillingDate && (
              <p className="text-sm text-muted-foreground">Next billing date: {subscription.nextBillingDate}</p>
            )}
            {subscription.trialEndsAt && (
              <p className="text-sm text-muted-foreground">Trial ends on: {subscription.trialEndsAt}</p>
            )}
          </div>
          <Button onClick={handleManageSubscription} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            {subscription.plan === "Free" ? "Upgrade Plan" : "Manage Subscription"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Subscription management and payments would be handled securely via Stripe (or your chosen payment provider).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availablePlans.map((plan) => (
          <Card key={plan.id} className={`shadow-md flex flex-col ${plan.isCurrent ? 'border-primary border-2' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-xl">{plan.name}</CardTitle>
                {plan.isCurrent && <Badge variant="secondary"><Star className="mr-1 h-3 w-3" /> Current</Badge>}
              </div>
              <CardDescription className="text-2xl font-semibold text-primary">{plan.price}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.isCurrent ? (
                <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={isLoading}>
                  Manage Current Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={handleManageSubscription} disabled={isLoading || plan.id === "enterprise_plan"}>
                  {plan.id === "enterprise_plan" ? "Contact Sales" : "Choose Plan"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past invoices and payment details.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Billing history would be displayed here, typically fetched from Stripe.
            </p>
            {/* Placeholder for a table or list of invoices */}
            <div className="mt-4 p-4 border rounded-md text-center text-sm">
                No invoices to display (Placeholder).
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
