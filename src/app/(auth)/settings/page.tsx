
"use client";

import * as React from "react";
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
import { type AddStaffInput, AddStaffSchema } from "./settings.schema";
import { addStaffAction, getAllStaffAction, toggleQuickLoginAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Users, Cog, KeyRound } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { StaffCredentials } from "@/lib/mock-auth-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { toast } = useToast();
  const [staffList, setStaffList] = React.useState<StaffCredentials[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(true);

  const fetchStaff = React.useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const list = await getAllStaffAction();
      setStaffList(list);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load staff list.", variant: "destructive" });
    } finally {
      setIsLoadingStaff(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const form = useForm<AddStaffInput>({
    resolver: zodResolver(AddStaffSchema),
    defaultValues: {
      name: "",
      loginId: "",
      password: "",
    },
  });

  async function onAddStaffSubmit(data: AddStaffInput) {
    const result = await addStaffAction(data);
    if (result.success) {
      toast({
        title: "Staff Action",
        description: result.message,
      });
      form.reset();
      fetchStaff(); // Refresh staff list
    } else {
      // Error handling for form fields
      if (result.errors?.name) form.setError("name", { message: result.errors.name.join(', ') });
      if (result.errors?.loginId) form.setError("loginId", { message: result.errors.loginId.join(', ') });
      if (result.errors?.password) form.setError("password", { message: result.errors.password.join(', ') });
      
      toast({
        title: "Error",
        description: result.message || "Failed to add staff. Please check the form.",
        variant: "destructive",
      });
    }
  }

  const handleQuickLoginToggle = async (loginId: string, enable: boolean) => {
    const result = await toggleQuickLoginAction({ loginId, enable });
    if (result.success) {
      toast({ title: "Quick Login Updated", description: result.message });
      // Optimistically update local state or re-fetch
      setStaffList(prevList => 
        prevList.map(staff => 
          staff.loginId === loginId ? { ...staff, enableQuickLogin: enable } : staff
        )
      );
      // Or fetchStaff(); for guaranteed consistency but potentially slower UI response
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cog className="h-8 w-8" />
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
        </div>
        <Link href="/" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
        </Link>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Users className="mr-2 h-6 w-6" /> Add New Staff
          </CardTitle>
          <CardDescription>Add new staff members to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddStaffSubmit)} className="space-y-6">
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
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <KeyRound className="mr-2 h-6 w-6" /> Manage Staff Quick Login
          </CardTitle>
          <CardDescription>Enable or disable quick login for staff members.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStaff ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : staffList.length > 0 ? (
            <ul className="space-y-4">
              {staffList.map((staff) => (
                <li key={staff.loginId} className="flex items-center justify-between p-3 border rounded-md bg-background shadow-sm">
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {staff.loginId}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`quick-login-${staff.loginId}`}
                      checked={!!staff.enableQuickLogin}
                      onCheckedChange={(checked) => handleQuickLoginToggle(staff.loginId, checked)}
                      aria-label={`Enable quick login for ${staff.name}`}
                    />
                    <Label htmlFor={`quick-login-${staff.loginId}`} className="text-sm">
                      Enable Quick Login
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No staff members found. Add staff using the form above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
