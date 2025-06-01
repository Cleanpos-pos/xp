
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
import { loginAction, getQuickLoginStaffAction } from "./(auth)/login/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LogIn, KeyRound, UserCheck, Users } from "lucide-react";
import type { StaffCredentials } from "@/lib/mock-auth-store";
import { Separator } from "@/components/ui/separator";

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
        // Optionally show a toast, but might be too noisy for a silent fetch
      } finally {
        setIsQuickLoginLoading(false);
      }
    }
    fetchQuickLoginUsers();
  }, []);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
    },
  });

  async function handleLogin(data: LoginInput) {
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
    // The user object from getQuickLoginStaffAction contains these.
    if (user.password) { // Ensure password exists, though it should for StaffCredentials
      await handleLogin({ employeeId: user.loginId, password: user.password });
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
          <CardDescription>Enter your credentials to access the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
              <FormField
                control={form.control}
                name="employeeId"
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
                key={user.loginId}
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
