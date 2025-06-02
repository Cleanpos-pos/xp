
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription as UiCardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { type AddStaffInput, AddStaffSchema } from "./settings.schema";
import { addStaffAction, getAllStaffAction, toggleQuickLoginAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Users, Cog, KeyRound, ShoppingBasket, DollarSign, Globe, Landmark, UserCog, ShieldCheck, ShieldAlert, ShieldQuestion, ListPlus } from "lucide-react"; // Added UserCog & Shield icons
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { StaffCredentials, UserRole } from "@/types"; // Import UserRole from @/types
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CatalogManagementTab } from "@/components/settings/catalog-management";
import { CashUpManagementTab } from "@/components/settings/cash-up-tab";
import { Badge } from "@/components/ui/badge"; // Import Badge

// Renaming RHF components for clarity to avoid conflict with generic HTML/div elements
// when not using RHF for a specific section (like Regional Settings)
const RHFFormItem = FormItem;
const RHFFormLabel = FormLabel;
const RHFFormDescription = FormDescription;

const userRoles: UserRole[] = ["clerk", "admin", "super_admin"];

const rolePermissions = {
  clerk: {
    name: "Clerk",
    can: [
      "Create & Manage Orders",
      "Track Order Statuses",
      "View Customer List & Basic Details",
      "Perform Daily Cash Up Procedures",
      "Process Payments",
    ],
    cannot: [
      "Access System Settings (Staff, Catalog, Regional)",
      "Change Service Prices or Item Catalog",
      "Add, Edit, or Delete Staff Accounts",
      "View Full Financial Reports or Detailed Analytics",
      "Override standard pricing or apply non-approved discounts",
    ],
  },
  admin: {
    name: "Admin",
    can: [
      "All Clerk permissions",
      "Manage Service & Item Catalog (Add, Edit, Price Changes)",
      "Add, Edit Staff Accounts (Clerks & other Admins)",
      "Manage Inventory & Supplies",
      "View Detailed Reports & Analytics",
      "Apply Approved Discounts & Promotions",
      "Manage Customer Loyalty Tiers & Price Bands",
    ],
    cannot: [
      "Manage Super Admin accounts",
      "Change certain core system configurations (e.g., Regional Settings, if restricted)",
      "Access highly sensitive system logs or direct database manipulation (typically)",
    ],
  },
  super_admin: {
    name: "Super Admin",
    can: [
      "All Admin permissions",
      "Full system access, including all Settings",
      "Manage all Staff Accounts (including Admins and Super Admins)",
      "Configure Regional Settings (Currency, Language)",
      "Oversee system-wide configurations & security",
      "Access audit logs and advanced system diagnostics",
    ],
    cannot: [], // Typically no restrictions
  },
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [staffList, setStaffList] = React.useState<StaffCredentials[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(true);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("USD");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("en");


  const fetchStaff = React.useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const list = await getAllStaffAction();
      setStaffList(list);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load staff list from Supabase.", variant: "destructive" });
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
      role: "clerk", // Default role
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
      fetchStaff();
    } else {
      if (result.errors?.name) form.setError("name", { message: result.errors.name.join(', ') });
      if (result.errors?.loginId) form.setError("loginId", { message: result.errors.loginId.join(', ') });
      if (result.errors?.password) form.setError("password", { message: result.errors.password.join(', ') });
      if (result.errors?.role) form.setError("role", { message: result.errors.role.join(', ') });
      
      toast({
        title: "Error",
        description: result.message || "Failed to add staff. Please check the form.",
        variant: "destructive",
      });
    }
  }

  const handleQuickLoginToggle = async (login_id: string, enable: boolean) => {
    const result = await toggleQuickLoginAction({ loginId: login_id, enable });
    if (result.success) {
      toast({ title: "Quick Login Updated", description: result.message });
      setStaffList(prevList =>
        prevList.map(staff =>
          staff.login_id === login_id ? { ...staff, enable_quick_login: enable } : staff
        )
      );
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleSaveRegionalSettings = () => {
    toast({
      title: "Preferences (Mock) Saved",
      description: `Currency: ${selectedCurrency}, Language: ${selectedLanguage}. Full implementation requires backend integration.`,
    });
  };

  const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "super_admin": return "destructive";
      case "admin": return "default";
      case "clerk":
      default: return "secondary";
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cog className="h-8 w-8" />
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
        </div>
        <Link href="/dashboard" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
        </Link>
      </div>

      <Tabs defaultValue="staffManagement" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger
            value="staffManagement"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Staff
          </TabsTrigger>
           <TabsTrigger
            value="rolesPermissions"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger
            value="itemCatalog"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Catalog
          </TabsTrigger>
          <TabsTrigger
            value="cashUp"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Cash Up
          </TabsTrigger>
          <TabsTrigger
            value="regionalSettings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Regional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staffManagement" className="mt-6 space-y-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Users className="mr-2 h-6 w-6" /> Add New Staff
              </CardTitle>
              <UiCardDescription>Add new staff members to the system (uses Supabase). Ensure you have added a 'role' column to your 'staff' table in Supabase.</UiCardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddStaffSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <RHFFormItem>
                        <RHFFormLabel>Staff Full Name</RHFFormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </RHFFormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="loginId"
                      render={({ field }) => (
                        <RHFFormItem>
                          <RHFFormLabel>Login ID</RHFFormLabel>
                          <FormControl>
                            <Input placeholder="e.g., STAFF002" {...field} />
                          </FormControl>
                          <FormMessage />
                        </RHFFormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <RHFFormItem>
                          <RHFFormLabel>Role</RHFFormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {userRoles.map((role) => (
                                <SelectItem key={role} value={role} className="capitalize">
                                  {role.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </RHFFormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <RHFFormItem>
                        <RHFFormLabel>Password</RHFFormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                         <RHFFormDescription>
                          NOTE: Passwords are NOT hashed in this prototype. Implement hashing for production.
                        </RHFFormDescription>
                        <FormMessage />
                      </RHFFormItem>
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
                <KeyRound className="mr-2 h-6 w-6" /> Manage Staff Quick Login & Roles
              </CardTitle>
              <UiCardDescription>View staff roles and enable or disable quick login (uses Supabase).</UiCardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : staffList.length > 0 ? (
                <ul className="space-y-4">
                  {staffList.map((staff) => (
                    <li key={staff.login_id} className="flex items-center justify-between p-3 border rounded-md bg-background shadow-sm">
                      <div className="flex flex-col">
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {staff.login_id}</p>
                         <Badge variant={getRoleBadgeVariant(staff.role || 'clerk')} className="w-fit mt-1 capitalize">
                          {staff.role ? staff.role.replace('_', ' ') : 'Clerk'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`quick-login-${staff.login_id}`}
                          checked={!!staff.enable_quick_login}
                          onCheckedChange={(checked) => handleQuickLoginToggle(staff.login_id, checked)}
                          aria-label={`Enable quick login for ${staff.name}`}
                        />
                        <Label htmlFor={`quick-login-${staff.login_id}`} className="text-sm">
                          Quick Login
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
        </TabsContent>

        <TabsContent value="rolesPermissions" className="mt-6 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <UserCog className="mr-2 h-6 w-6" /> User Roles & Permissions Overview
              </CardTitle>
              <UiCardDescription>This section outlines the capabilities of different user roles. Actual enforcement of these permissions requires further development.</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(rolePermissions) as UserRole[]).map((roleKey) => {
                const roleInfo = rolePermissions[roleKey];
                let IconComponent = ShieldQuestion;
                if (roleKey === 'clerk') IconComponent = ShieldAlert;
                if (roleKey === 'admin') IconComponent = ShieldCheck;
                if (roleKey === 'super_admin') IconComponent = UserCog; // Or a more distinct "super" icon
                
                return (
                  <Card key={roleKey} className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold flex items-center capitalize">
                        <IconComponent className="mr-2 h-5 w-5 text-primary" />
                        {roleInfo.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-1 text-green-600">Can Do:</h4>
                        <ul className="list-disc list-inside space-y-0.5">
                          {roleInfo.can.map((perm, i) => <li key={`can-${i}`}>{perm}</li>)}
                        </ul>
                      </div>
                      {roleInfo.cannot.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-1 text-red-600">Cannot Do:</h4>
                          <ul className="list-disc list-inside space-y-0.5">
                            {roleInfo.cannot.map((perm, i) => <li key={`cannot-${i}`}>{perm}</li>)}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
             <CardFooter>
              <UiCardDescription className="text-xs">
                Note: Assigning roles is now possible when adding staff. However, the actual restriction of access based on these roles (e.g., hiding buttons, preventing actions) is not yet implemented in this prototype and would require further development across the application.
              </UiCardDescription>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="itemCatalog" className="mt-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <ShoppingBasket className="mr-2 h-6 w-6" /> Service &amp; Item Catalog Management
              </CardTitle>
              <UiCardDescription>Organize your services and items into hierarchical categories.</UiCardDescription>
            </CardHeader>
            <CardContent>
              <CatalogManagementTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashUp" className="mt-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <DollarSign className="mr-2 h-6 w-6" /> Cash Up Management
              </CardTitle>
              <UiCardDescription>Perform end-of-day cash reconciliation and view history.</UiCardDescription>
            </CardHeader>
            <CardContent>
              <CashUpManagementTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regionalSettings" className="mt-6">
         <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Globe className="mr-2 h-6 w-6" /> Regional Settings
              </CardTitle>
              <UiCardDescription>Manage system currency and language preferences. (UI Placeholders)</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-currency" className="flex items-center"><Landmark className="mr-2 h-4 w-4 text-muted-foreground" /> System Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger id="system-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the primary currency for transactions and reporting.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-language" className="flex items-center"><Globe className="mr-2 h-4 w-4 text-muted-foreground" /> Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                   <SelectTrigger id="system-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español (Spanish)</SelectItem>
                    <SelectItem value="fr">Français (French)</SelectItem>
                    <SelectItem value="de">Deutsch (German)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the display language for the application interface.
                </p>
              </div>

              <Button onClick={handleSaveRegionalSettings}>Save Regional Preferences</Button>
               <p className="text-xs text-muted-foreground pt-4">
                Note: These settings are currently UI placeholders. Full currency and language switching requires backend and internationalization (i18n) integration throughout the application.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

