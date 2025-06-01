
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddStaffSchema, type AddStaffInput, addStaffAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Users, Cog } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();

  const form = useForm<AddStaffInput>({
    resolver: zodResolver(AddStaffSchema),
    defaultValues: {
      name: "",
      loginId: "",
      password: "",
    },
  });

  async function onSubmit(data: AddStaffInput) {
    const result = await addStaffAction(data);
    if (result.success) {
      toast({
        title: "Staff Action",
        description: result.message,
      });
      form.reset(); // Reset form after successful submission
    } else {
      if (result.errors) {
        if (result.errors.name) form.setError("name", { message: result.errors.name.join(', ') });
        if (result.errors.loginId) form.setError("loginId", { message: result.errors.loginId.join(', ') });
        if (result.errors.password) form.setError("password", { message: result.errors.password.join(', ') });
      }
      toast({
        title: "Error",
        description: result.message || "Failed to add staff. Please check the form.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cog className="h-8 w-8" />
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
        </div>
        <Link href="/login" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
        </Link>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Users className="mr-2 h-6 w-6" /> Staff Management
          </CardTitle>
          <CardDescription>Add new staff members to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loginId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., STAFF002" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding Staff..." : "Add Staff Member"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Placeholder for listing staff or other settings in the future */}
      {/* 
      <Card>
        <CardHeader><CardTitle>Current Staff</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Staff listing will appear here.</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}
