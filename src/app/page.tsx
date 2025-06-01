
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
import { LoginSchema, type LoginInput } from "./(auth)/login/login.schema";
import { loginAction } from "./(auth)/login/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function RootLoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    const result = await loginAction(data);
    if (result.success) {
      toast({
        title: "Login Successful",
        description: result.message,
      });
      router.push("/find-or-add-customer"); // Redirect to find/add customer page
    } else {
      if (result.errors) {
         // Field-specific errors
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

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl flex items-center justify-center">
          <LogIn className="mr-2 h-6 w-6" /> Staff Login
        </CardTitle>
        <CardDescription>Enter your credentials to access the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
  );
}
