
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LoginSchema, type LoginInput } from "./(auth)/login/login.schema";
import { loginAction, getQuickLoginStaffAction } from "./(auth)/login/actions"; // Actions now use Supabase
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LogIn, KeyRound, UserCheck, Users } from "lucide-react";
import type { StaffCredentials } from "@/lib/mock-auth-store"; // Interface from mock-auth-store (now Supabase backed)
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";


export default function RootLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [quickLoginUsers, setQuickLoginUsers] = React.useState<StaffCredentials[]>([]);
  const [isQuickLoginLoading, setIsQuickLoginLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchQuickLoginUsers() {
      setIsQuickLoginLoading(true);
      try {
        const users = await getQuickLoginStaffAction();
        setQuickLoginUsers(users);
      } catch (error) {
        console.error("Failed to fetch quick login users:", error);
        toast({ title: "Error", description: "Could not load quick login users.", variant: "destructive"});
      } finally {
        setIsQuickLoginLoading(false);
      }
    }
    fetchQuickLoginUsers();
  }, [toast]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      employeeId: "", // This is login_id in the DB
      password: "",
    },
  });

  async function handleLogin(data: LoginInput) {
    // loginAction expects data.employeeId (which is login_id) and data.password
    const result = await loginAction(data); 
    if (result.success) {
      toast({
        title: "Login Successful",
        description: result.message,
      });
      router.push("/find-or-add-customer");
    } else {
      if (result.errors) {
        if (result.errors.employeeId) form.setError("employeeId", { message: result.errors.employeeId.join(', ') });
        if (result.errors.password) form.setError("password", { message: result.errors.password.join(', ') });
      }
      toast({
        title: "Login Failed",
        description: result.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  const handleQuickLogin = async (user: StaffCredentials) => {
    // The loginAction requires employeeId and password.
    // User object from Supabase has login_id and hashed_password (which is plain for now)
    if (user.hashed_password) { 
      await handleLogin({ employeeId: user.login_id, password: user.hashed_password });
    } else {
      toast({
        title: "Quick Login Error",
        description: `Password not found for ${user.name}. Cannot quick login.`,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="w-full max-w-sm space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl flex items-center justify-center">
            <LogIn className="mr-2 h-6 w-6" /> Staff Login
          </CardTitle>
          <CardDescription>Enter your credentials to access the system. (Now uses Supabase)</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId" // This should map to login_id
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., STAFF001" {...field} />
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Logging In..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isQuickLoginLoading && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              <Skeleton className="h-5 w-5 mr-2" /> <Skeleton className="h-5 w-32" />
            </CardTitle>
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
           <CardFooter>
            <Skeleton className="h-4 w-full" />
          </CardFooter>
        </Card>
      )}

      {!isQuickLoginLoading && quickLoginUsers.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" /> Quick Login
            </CardTitle>
            <CardDescription>Click your name to log in instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLoginUsers.map((user) => (
              <Button
                key={user.login_id} // Use login_id as key
                variant="secondary"
                className="w-full justify-start"
                onClick={() => handleQuickLogin(user)}
                disabled={form.formState.isSubmitting}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {user.name}
              </Button>
            ))}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">
              Enable quick login for your account in <Link href="/settings" className="underline hover:text-primary">Settings</Link>.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
