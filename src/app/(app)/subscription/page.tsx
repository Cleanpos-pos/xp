
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Star, ArrowRight, RefreshCw, Info } from "lucide-react";

// Mock data - in a real app, this would come from your backend/Stripe
type SubscriptionPlan = "Standard" | "Pro" | "Enterprise";
interface UserSubscription {
  plan: SubscriptionPlan;
  status: "active" | "inactive" | "past_due" | "canceled" | "trialing"; // Added trialing
  nextBillingDate?: string;
  trialEndsAt?: string; // Added for trial period
}

// Helper to calculate trial end date
const getTrialEndDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  // Mock current subscription - now showing a user in a trial for Standard Plan
  const [subscription, setSubscription] = useState<UserSubscription>({
    plan: "Standard",
    status: "trialing",
    trialEndsAt: getTrialEndDate(60), // Example: 60-day trial
    nextBillingDate: getTrialEndDate(60), // Billing starts after trial
  });

  // Mock available plans.
  const availablePlans = [
    {
      id: "standard_plan",
      name: "Standard Plan",
      price: "£45/month",
      features: ["Full access to core features", "Standard usage limits", "Email support", "Basic analytics"],
      isCurrent: subscription.plan === "Standard",
      trialInfo: "Includes a 60-day free trial for new users.",
    },
    {
      id: "pro_plan",
      name: "Pro Plan",
      price: "£65/month",
      features: ["All Standard features", "Increased usage limits", "Priority email support", "Advanced analytics & Reporting", "AI Insights (Basic Tier)"],
      isCurrent: subscription.plan === "Pro",
    },
    {
      id: "enterprise_plan",
      name: "Enterprise Plan",
      price: "Contact Us",
      features: ["All Pro features", "Custom integrations", "Dedicated account manager", "Premium SLA & Support", "Volume discounts", "Custom AI Models"],
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
            <h3 className="text-lg font-semibold mb-2">Current Plan: <Badge variant={subscription.status === "active" || subscription.status === "trialing" ? "default" : "destructive"}>{subscription.plan}</Badge></h3>
            <p className="text-sm text-muted-foreground">
              Status: <span className={subscription.status === "active" || subscription.status === "trialing" ? "text-green-600" : "text-red-600"}>{subscription.status}</span>
            </p>
            {subscription.status === "trialing" && subscription.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                Free trial ends on: {subscription.trialEndsAt}
              </p>
            )}
            {subscription.nextBillingDate && subscription.status !== "trialing" && (
              <p className="text-sm text-muted-foreground">Next billing date: {subscription.nextBillingDate}</p>
            )}
             {subscription.status === "trialing" && subscription.nextBillingDate && (
              <p className="text-sm text-muted-foreground">Your first bill will be on: {subscription.nextBillingDate} (after trial ends)</p>
            )}
          </div>
          <Button onClick={handleManageSubscription} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            Manage Subscription
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Subscription management and payments would be handled securely via Stripe (or your chosen payment provider).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availablePlans.map((plan) => (
          <Card key={plan.id} className={`shadow-md flex flex-col ${plan.isCurrent && subscription.status !== "trialing" ? 'border-primary border-2' : (plan.name === "Standard" && subscription.status === "trialing" ? 'border-primary border-2' : '')}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-xl">{plan.name}</CardTitle>
                {plan.isCurrent && subscription.status !== "trialing" && <Badge variant="secondary"><Star className="mr-1 h-3 w-3" /> Current</Badge>}
                {plan.name === "Standard" && subscription.status === "trialing" && <Badge variant="secondary"><Star className="mr-1 h-3 w-3" /> Trialing</Badge>}
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
              {plan.trialInfo && plan.name === "Standard" && (
                <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-px flex-shrink-0" />
                  <span>{plan.trialInfo}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {plan.isCurrent && subscription.status !== "trialing" ? (
                <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={isLoading}>
                  Manage Current Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={handleManageSubscription} disabled={isLoading || plan.id === "enterprise_plan" || (subscription.status === "trialing" && plan.name === "Standard")}>
                   {subscription.status === "trialing" && plan.name === "Standard" ? "Currently in Trial" : plan.id === "enterprise_plan" ? "Contact Sales" : "Choose Plan"}
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
