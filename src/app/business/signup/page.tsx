"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SignUpSchema, type SignUpInput } from "./signup.schema";
import { registerBusinessAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from "lucide-react";

export default function BusinessSignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState("");

  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      storeName: "",
      slug: "",
      email: "",
      password: "",
    },
  });

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("storeName", name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue("slug", slug);
    setStoreUrl(slug);
  };
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    form.setValue("slug", slug);
    setStoreUrl(slug);
  };

  async function onSubmit(data: SignUpInput) {
    const result = await registerBusinessAction(data.storeName, data.slug, data.email, data.password);
    if (result.success) {
      toast({
        title: "Store Created!",
        description: result.message,
      });
      // Redirect to the newly created store's login or a confirmation page
      router.push(`/login`);
    } else {
      toast({
        title: "Registration Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-lg mx-4">
            <CardHeader>
            <CardTitle className="text-2xl font-headline">Launch Your Store</CardTitle>
            <CardDescription>
                Create your business account. This will make you the administrator for your new store.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Acme Cleaners" {...field} onChange={handleStoreNameChange} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Store URL ID</FormLabel>
                        <FormControl>
                            <div className="flex items-center">
                                <Input 
                                    placeholder="e.g., acme-cleaners" 
                                    {...field} 
                                    onChange={handleSlugChange}
                                    className="rounded-r-none"
                                />
                                <span className="text-sm bg-muted text-muted-foreground px-3 py-2 border border-l-0 rounded-r-md">.xpcs.store</span>
                            </div>
                        </FormControl>
                        <FormDescription>
                            This will be your unique web address. Cannot be changed later.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Your Email Address (Admin)</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
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
                        <FormDescription>
                            Must be at least 8 characters long.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating Your Store..." : "Create My Store"}
                </Button>
                </form>
            </Form>
            </CardContent>
             <CardFooter>
                <Link href="/" passHref className="w-full">
                    <Button variant="link" className="w-full text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    </div>
  );
}
