
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
import { LoginSchema, type LoginInput } from "./login.schema";
import { loginAction, getQuickLoginStaffAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LogIn, KeyRound, UserCheck, Users, Grid, Globe, Cog, Building } from "lucide-react";
import type { StaffCredentials } from "@/types";
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";
import { AlphanumericKeypadModal } from "@/components/ui/alphanumeric-keypad-modal";

export default function RootLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [quickLoginUsers, setQuickLoginUsers] = React.useState<StaffCredentials[]>([]);
  const [isQuickLoginLoading, setIsQuickLoginLoading] = React.useState(true);

  // State for Keypad Modals
  const [isEmployeeIdModalOpen, setIsEmployeeIdModalOpen] = React.useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [currentEmployeeIdInput, setCurrentEmployeeIdInput] = React.useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = React.useState("");

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
      employeeId: "",
      password: "",
    },
  });

  // Sync form values with local state when modals open
  React.useEffect(() => {
    if (isEmployeeIdModalOpen) {
      setCurrentEmployeeIdInput(form.getValues('employeeId'));
    }
  }, [isEmployeeIdModalOpen, form]);

   React.useEffect(() => {
    if (isPasswordModalOpen) {
      setCurrentPasswordInput(form.getValues('password'));
    }
  }, [isPasswordModalOpen, form]);


  async function handleLogin(data: LoginInput) {
    try {
      const result = await loginAction(data);
      // Server action now handles redirection on success. We only handle failure here.
      if (result && !result.success) {
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
      // On success, the server action will redirect and this client code won't run further.
    } catch (error: any) {
      // This catch block will handle the NEXT_REDIRECT error thrown by the server action
      // We can safely ignore it, as the browser will handle the redirection.
      if (error.message.includes('NEXT_REDIRECT')) {
        // This is expected, do nothing. The browser will redirect.
      } else {
        // Handle other unexpected errors
        console.error("An unexpected error occurred during login:", error);
        toast({
          title: "Login Failed",
          description: "An unexpected client-side error occurred.",
          variant: "destructive",
        });
      }
    }
  }
  
  const handleQuickLogin = async (user: StaffCredentials) => {
    if (user.hashed_password) { 
      // The server action will redirect, no client-side navigation needed
      await handleLogin({ employeeId: user.login_id, password: user.hashed_password });
    } else {
      toast({
        title: "Quick Login Error",
        description: `Password not found for ${user.name}. Cannot quick login.`,
        variant: "destructive",
      });
    }
  };

  const handleEmployeeIdConfirm = (value: string) => {
    form.setValue('employeeId', value, { shouldValidate: true });
  };

  const handlePasswordConfirm = (value: string) => {
    form.setValue('password', value, { shouldValidate: true });
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 relative">
        <div className="absolute top-6 left-6">
            <Link href="/" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="font-bold text-xl font-headline">XP Clean</span>
            </Link>
        </div>
        <div className="absolute top-6 right-6 flex items-center gap-2">
            <Link href="/business/signup" passHref>
                <Button variant="outline" size="sm">
                  <Building className="mr-2 h-4 w-4"/> Make New Store
                </Button>
            </Link>
            <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label="Staff Management Settings">
                <Cog className="h-8 w-8" />
              </Button>
            </Link>
        </div>

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
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {
                            setCurrentEmployeeIdInput(field.value);
                            setIsEmployeeIdModalOpen(true);
                            }}> 
                            <Input 
                                placeholder="Tap to enter ID" 
                                readOnly 
                                className="cursor-pointer flex-grow"
                                value={field.value}
                            />
                            <Grid className="h-5 w-5 text-muted-foreground flex-shrink-0" /> 
                            </div>
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
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => {
                            setCurrentPasswordInput(field.value);
                            setIsPasswordModalOpen(true);
                            }}> 
                            <Input 
                                type="password" 
                                placeholder="Tap to enter password" 
                                readOnly 
                                className="cursor-pointer flex-grow"
                                value={field.value}
                            />
                            <KeyRound className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </div>
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

        {/* Employee ID Keypad Modal */}
        <AlphanumericKeypadModal
            isOpen={isEmployeeIdModalOpen}
            onOpenChange={setIsEmployeeIdModalOpen}
            inputValue={currentEmployeeIdInput}
            onInputChange={setCurrentEmployeeIdInput}
            onConfirm={handleEmployeeIdConfirm}
            title="Enter Employee ID"
        />

        {/* Password Keypad Modal */}
        <AlphanumericKeypadModal
            isOpen={isPasswordModalOpen}
            onOpenChange={setIsPasswordModalOpen}
            inputValue={currentPasswordInput}
            onInputChange={setCurrentPasswordInput}
            onConfirm={handlePasswordConfirm}
            title="Enter Password"
        />

        {isQuickLoginLoading ? (
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
            </Card>
        ) : quickLoginUsers.length > 0 && (
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
                    key={user.login_id}
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
    </div>
  );
}
