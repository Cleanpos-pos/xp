
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription as RHFFormDescription,
  FormField,
  FormItem as RHFFormItem,
  FormLabel as RHFFormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription as UiCardDescription } from "@/components/ui/card";
import { type AddStaffInput, AddStaffSchema } from "./settings.schema";
import { addStaffAction, getAllStaffAction, toggleQuickLoginAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Users, Cog, KeyRound, ShoppingBasket, DollarSign, Globe, Landmark, UserCog, ShieldCheck, ShieldAlert, ShieldQuestion, ListPlus, PrinterIcon, SettingsIcon, MonitorSmartphone, Percent, Gift, CalendarIcon, Building, ImageUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // Import next/image
import { ArrowLeft } from "lucide-react";
import type { StaffCredentials, UserRole } from "@/types"; 
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CatalogManagementTab } from "@/components/settings/catalog-management";
import { CashUpManagementTab } from "@/components/settings/cash-up-tab";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const FormLabel = RHFFormLabel; // Alias for clarity if needed elsewhere or for future refactor
const FormDescription = RHFFormDescription;
const FormItem = RHFFormItem;

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
      "Access System Settings (Staff, Catalog, Regional, Printer, Offers)",
      "Change Service Prices or Item Catalog",
      "Add, Edit, or Delete Staff Accounts",
      "View Full Financial Reports or Detailed Analytics",
      "Override standard pricing or apply non-approved discounts (unless system allows via offer)",
    ],
  },
  admin: {
    name: "Admin",
    can: [
      "All Clerk permissions",
      "Manage Service & Item Catalog (Add, Edit, Price Changes)",
      "Manage Special Offers",
      "Add, Edit Staff Accounts (Clerks & other Admins)",
      "Manage Inventory & Supplies",
      "View Detailed Reports & Analytics",
      "Apply Approved Discounts & Promotions",
      "Manage Customer Loyalty Tiers & Price Bands",
      "Configure Printer Settings (Placeholders)"
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
    cannot: [], 
  },
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [staffList, setStaffList] = React.useState<StaffCredentials[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(true);

  // Company & Regional Settings State
  const [companyName, setCompanyName] = React.useState<string>("XP Clean Ltd.");
  const [companyAddress, setCompanyAddress] = React.useState<string>("123 Clean Street, Suite 100, YourTown, YT 54321");
  const [companyPhone, setCompanyPhone] = React.useState<string>("(555) 123-4567");
  const [vatTaxId, setVatTaxId] = React.useState<string>("GB123456789");
  const [vatSalesTaxRate, setVatSalesTaxRate] = React.useState<string>("20");
  const [includeVatInPrices, setIncludeVatInPrices] = React.useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("GBP");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("en");
  const [companyLogoUrl, setCompanyLogoUrl] = React.useState<string | null>("https://placehold.co/150x50.png?text=Your+Logo");


  // Printer Settings State
  const [receiptPrinter, setReceiptPrinter] = React.useState<string>("thermal_80mm");
  const [customerReceiptCopies, setCustomerReceiptCopies] = React.useState<string>("1");
  const [stubPrinter, setStubPrinter] = React.useState<string>("dotmatrix_76mm");
  const [receiptHeader, setReceiptHeader] = React.useState<string>("XP Clean - Your Town Branch");
  const [receiptFooter, setReceiptFooter] = React.useState<string>("Thank you for your business!");

  // Special Offers State
  const [buyXgetY_X, setBuyXgetY_X] = React.useState<string>("3");
  const [buyXgetY_Y, setBuyXgetY_Y] = React.useState<string>("2");
  const [buyXgetY_Notes, setBuyXgetY_Notes] = React.useState<string>("");
  const [buyXgetY_Active, setBuyXgetY_Active] = React.useState<boolean>(false);
  const [buyXgetY_ValidFrom, setBuyXgetY_ValidFrom] = React.useState<Date | undefined>();
  const [buyXgetY_ValidTo, setBuyXgetY_ValidTo] = React.useState<Date | undefined>();
  const [isBuyXgetYFromCalendarOpen, setIsBuyXgetYFromCalendarOpen] = React.useState(false);
  const [isBuyXgetYToCalendarOpen, setIsBuyXgetYToCalendarOpen] = React.useState(false);

  const [bundle_Items, setBundle_Items] = React.useState<string>("2");
  const [bundle_Price, setBundle_Price] = React.useState<string>("10.00");
  const [bundle_Notes, setBundle_Notes] = React.useState<string>("");
  const [bundle_Active, setBundle_Active] = React.useState<boolean>(false);
  const [bundle_ValidFrom, setBundle_ValidFrom] = React.useState<Date | undefined>();
  const [bundle_ValidTo, setBundle_ValidTo] = React.useState<Date | undefined>();
  const [isBundleFromCalendarOpen, setIsBundleFromCalendarOpen] = React.useState(false);
  const [isBundleToCalendarOpen, setIsBundleToCalendarOpen] = React.useState(false);

  const [spendGet_Threshold, setSpendGet_Threshold] = React.useState<string>("50.00");
  const [spendGet_FreeItemDesc, setSpendGet_FreeItemDesc] = React.useState<string>("1 Free Shirt Press");
  const [spendGet_Notes, setSpendGet_Notes] = React.useState<string>(""); // Added state for spend & get notes
  const [spendGet_Active, setSpendGet_Active] = React.useState<boolean>(false);
  const [spendGet_ValidFrom, setSpendGet_ValidFrom] = React.useState<Date | undefined>();
  const [spendGet_ValidTo, setSpendGet_ValidTo] = React.useState<Date | undefined>();
  const [isSpendGetFromCalendarOpen, setIsSpendGetFromCalendarOpen] = React.useState(false);
  const [isSpendGetToCalendarOpen, setIsSpendGetToCalendarOpen] = React.useState(false);

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
      role: "clerk", 
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
      if (result.errors?.name && Array.isArray(result.errors.name)) form.setError("name", { message: result.errors.name.join(', ') });
      if (result.errors?.loginId && Array.isArray(result.errors.loginId)) form.setError("loginId", { message: result.errors.loginId.join(', ') });
      if (result.errors?.password && Array.isArray(result.errors.password)) form.setError("password", { message: result.errors.password.join(', ') });
      if (result.errors?.role && Array.isArray(result.errors.role)) form.setError("role", { message: result.errors.role.join(', ') });
      
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

  const handleSaveCompanyRegionalSettings = () => {
    // In a real app, these values would be persisted
    toast({
      title: "Company & Regional Settings (Mock) Saved",
      description: `Company: ${companyName}, Currency: ${selectedCurrency}, Language: ${selectedLanguage}, VAT Rate: ${vatSalesTaxRate}%, VAT Included: ${includeVatInPrices}. Logo URL (mock): ${companyLogoUrl}. Full implementation requires backend.`,
    });
  };
  
  const handleSavePrinterSettings = () => {
    toast({
      title: "Printer Settings (Mock) Saved",
      description: `Receipt Printer: ${receiptPrinter}, Customer Copies: ${customerReceiptCopies}, Stub Printer: ${stubPrinter}. Header/Footer updated. These are UI placeholders.`,
    });
  };

  const handleSaveSpecialOffer = (offerType: string, validFrom?: Date, validTo?: Date) => {
     let dateMessage = "";
     if (validFrom) dateMessage += ` Valid From: ${format(validFrom, "PPP")}.`;
     if (validTo) dateMessage += ` Valid To: ${format(validTo, "PPP")}.`;
     toast({
      title: "Special Offer (Mock) Saved",
      description: `${offerType} parameters have been 'saved'.${dateMessage} Implementation of offer logic is pending.`,
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
  
  const handleLogoUploadPlaceholder = () => {
    toast({
      title: "Logo Upload (Placeholder)",
      description: "Actual logo upload functionality requires backend integration for file storage and processing. This is a UI placeholder.",
      duration: 5000,
    });
  };


  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
        </div>
        <Link href="/dashboard" passHref>
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
        </Link>
      </div>

      <Tabs defaultValue="staffManagement" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
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
            Roles &amp; Permissions
          </TabsTrigger>
          <TabsTrigger
            value="itemCatalog"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Catalog
          </TabsTrigger>
           <TabsTrigger
            value="specialOffers"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
             <Percent className="mr-1.5 h-4 w-4" /> Offers
          </TabsTrigger>
          <TabsTrigger
            value="cashUp"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Cash Up
          </TabsTrigger>
          <TabsTrigger
            value="printerSetup"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Printers
          </TabsTrigger>
          <TabsTrigger
            value="companyRegional"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground"
          >
            Company
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
                      <FormItem>
                        <FormLabel>Staff Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
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
                        </FormItem>
                      )}
                    />
                  </div>
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
                          NOTE: Passwords are NOT hashed in this prototype. Implement hashing for production.
                        </FormDescription>
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
                <KeyRound className="mr-2 h-6 w-6" /> Manage Staff Quick Login &amp; Roles
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
                <UserCog className="mr-2 h-6 w-6" /> User Roles &amp; Permissions Overview
              </CardTitle>
              <UiCardDescription>This section outlines the capabilities of different user roles. Actual enforcement of these permissions requires further development.</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(rolePermissions) as UserRole[]).map((roleKey) => {
                const roleInfo = rolePermissions[roleKey];
                let IconComponent = ShieldQuestion;
                if (roleKey === 'clerk') IconComponent = ShieldAlert;
                if (roleKey === 'admin') IconComponent = ShieldCheck;
                if (roleKey === 'super_admin') IconComponent = UserCog;
                
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
        
        <TabsContent value="specialOffers" className="mt-6 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center">
                <Gift className="mr-2 h-5 w-5 text-green-600" /> "Buy X Get Y (Cheapest Free)" Offer
              </CardTitle>
              <UiCardDescription>Configure a "cheapest item free" type of promotion.</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyXgetY-X">Items to Buy (X)</Label>
                  <Input id="buyXgetY-X" type="number" value={buyXgetY_X} onChange={(e) => setBuyXgetY_X(e.target.value)} placeholder="e.g., 3" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="buyXgetY-Y">Items to Pay For (Y)</Label>
                  <Input id="buyXgetY-Y" type="number" value={buyXgetY_Y} onChange={(e) => setBuyXgetY_Y(e.target.value)} placeholder="e.g., 2" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyXgetY-validFrom">Valid From</Label>
                  <Popover open={isBuyXgetYFromCalendarOpen} onOpenChange={setIsBuyXgetYFromCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button id="buyXgetY-validFrom" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !buyXgetY_ValidFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {buyXgetY_ValidFrom ? format(buyXgetY_ValidFrom, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={buyXgetY_ValidFrom} onSelect={(date) => { setBuyXgetY_ValidFrom(date); setIsBuyXgetYFromCalendarOpen(false);}} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="buyXgetY-validTo">Valid To</Label>
                  <Popover open={isBuyXgetYToCalendarOpen} onOpenChange={setIsBuyXgetYToCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button id="buyXgetY-validTo" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !buyXgetY_ValidTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {buyXgetY_ValidTo ? format(buyXgetY_ValidTo, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={buyXgetY_ValidTo} onSelect={(date) => { setBuyXgetY_ValidTo(date); setIsBuyXgetYToCalendarOpen(false);}} disabled={(date) => buyXgetY_ValidFrom ? date < buyXgetY_ValidFrom : false} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="buyXgetY-notes">Applicable Items/Categories (Notes)</Label>
                <Textarea id="buyXgetY-notes" value={buyXgetY_Notes} onChange={(e) => setBuyXgetY_Notes(e.target.value)} placeholder="e.g., Applies to all shirts. Cheapest of the X items is free." className="mt-1" rows={2} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="buyXgetY-active" checked={buyXgetY_Active} onCheckedChange={setBuyXgetY_Active} />
                <Label htmlFor="buyXgetY-active">Offer Active</Label>
              </div>
              <Button onClick={() => handleSaveSpecialOffer("Buy X Get Y", buyXgetY_ValidFrom, buyXgetY_ValidTo)}>Save Offer Settings</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center">
                <Percent className="mr-2 h-5 w-5 text-blue-600" /> "Bundle Deal (X Items for Price Y)"
              </CardTitle>
              <UiCardDescription>Set a fixed price for a bundle of items.</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bundle-items">Number of Items in Bundle</Label>
                  <Input id="bundle-items" type="number" value={bundle_Items} onChange={(e) => setBundle_Items(e.target.value)} placeholder="e.g., 3" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="bundle-price">Fixed Price for Bundle ({selectedCurrency})</Label>
                  <Input id="bundle-price" type="number" step="0.01" value={bundle_Price} onChange={(e) => setBundle_Price(e.target.value)} placeholder="e.g., 15.00" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bundle-validFrom">Valid From</Label>
                   <Popover open={isBundleFromCalendarOpen} onOpenChange={setIsBundleFromCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button id="bundle-validFrom" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !bundle_ValidFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bundle_ValidFrom ? format(bundle_ValidFrom, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={bundle_ValidFrom} onSelect={(date) => { setBundle_ValidFrom(date); setIsBundleFromCalendarOpen(false);}} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="bundle-validTo">Valid To</Label>
                   <Popover open={isBundleToCalendarOpen} onOpenChange={setIsBundleToCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button id="bundle-validTo" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !bundle_ValidTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bundle_ValidTo ? format(bundle_ValidTo, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={bundle_ValidTo} onSelect={(date) => { setBundle_ValidTo(date); setIsBundleToCalendarOpen(false);}} disabled={(date) => bundle_ValidFrom ? date < bundle_ValidFrom : false} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="bundle-notes">Applicable Items/Categories (Notes)</Label>
                <Textarea id="bundle-notes" value={bundle_Notes} onChange={(e) => setBundle_Notes(e.target.value)} placeholder="e.g., Mix and match any 3 standard shirts." className="mt-1" rows={2} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="bundle-active" checked={bundle_Active} onCheckedChange={setBundle_Active} />
                <Label htmlFor="bundle-active">Offer Active</Label>
              </div>
              <Button onClick={() => handleSaveSpecialOffer("Bundle Deal", bundle_ValidFrom, bundle_ValidTo)}>Save Offer Settings</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-yellow-500" /> "Spend &amp; Get Free Item" Offer
              </CardTitle>
              <UiCardDescription>Offer a free item when a customer spends a certain amount.</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="spendGet-threshold">Spend Threshold ({selectedCurrency})</Label>
                <Input id="spendGet-threshold" type="number" step="0.01" value={spendGet_Threshold} onChange={(e) => setSpendGet_Threshold(e.target.value)} placeholder="e.g., 50.00" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="spendGet-freeItem">Description of Free Item</Label>
                <Input id="spendGet-freeItem" value={spendGet_FreeItemDesc} onChange={(e) => setSpendGet_FreeItemDesc(e.target.value)} placeholder="e.g., 1 Free Tie Clean, Cheapest item up to value X" className="mt-1" />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spendGet-validFrom">Valid From</Label>
                   <Popover open={isSpendGetFromCalendarOpen} onOpenChange={setIsSpendGetFromCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button id="spendGet-validFrom" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !spendGet_ValidFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {spendGet_ValidFrom ? format(spendGet_ValidFrom, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={spendGet_ValidFrom} onSelect={(date) => { setSpendGet_ValidFrom(date); setIsSpendGetFromCalendarOpen(false);}} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="spendGet-validTo">Valid To</Label>
                  <Popover open={isSpendGetToCalendarOpen} onOpenChange={setIsSpendGetToCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button id="spendGet-validTo" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !spendGet_ValidTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {spendGet_ValidTo ? format(spendGet_ValidTo, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={spendGet_ValidTo} onSelect={(date) => { setSpendGet_ValidTo(date); setIsSpendGetToCalendarOpen(false);}} disabled={(date) => spendGet_ValidFrom ? date < spendGet_ValidFrom : false} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label htmlFor="spendGet-notes">Additional Offer Details/Exclusions (Notes)</Label>
                <Textarea id="spendGet-notes" value={spendGet_Notes} onChange={(e) => setSpendGet_Notes(e.target.value)} placeholder="e.g., Not valid with other offers. Excludes leather items." className="mt-1" rows={2} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="spendGet-active" checked={spendGet_Active} onCheckedChange={setSpendGet_Active} />
                <Label htmlFor="spendGet-active">Offer Active</Label>
              </div>
              <Button onClick={() => handleSaveSpecialOffer("Spend & Get", spendGet_ValidFrom, spendGet_ValidTo)}>Save Offer Settings</Button>
            </CardContent>
             <CardFooter>
                <UiCardDescription className="text-xs">
                    Note: The parameters set here are for configuration purposes. Applying these offers to orders requires additional logic in the order creation process.
                </UiCardDescription>
            </CardFooter>
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

        <TabsContent value="printerSetup" className="mt-6">
         <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <PrinterIcon className="mr-2 h-6 w-6" /> Printer Setup
              </CardTitle>
              <UiCardDescription>Configure default printers and receipt templates. (UI Placeholders)</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <Label htmlFor="receipt-printer" className="flex items-center"><MonitorSmartphone className="mr-2 h-4 w-4 text-muted-foreground" /> Default Receipt Printer</Label>
                  <Select value={receiptPrinter} onValueChange={setReceiptPrinter}>
                    <SelectTrigger id="receipt-printer" className="mt-1">
                      <SelectValue placeholder="Select receipt printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thermal_80mm">Thermal Printer (80mm)</SelectItem>
                      <SelectItem value="dotmatrix_76mm">Dot Matrix (76mm)</SelectItem>
                      <SelectItem value="a4_letter">Standard A4/Letter Printer</SelectItem>
                      <SelectItem value="none">None (Manual/No Print)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-receipt-copies">Customer Receipt Copies</Label>
                  <Select value={customerReceiptCopies} onValueChange={setCustomerReceiptCopies}>
                    <SelectTrigger id="customer-receipt-copies" className="mt-1">
                      <SelectValue placeholder="Select no. of copies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Copy</SelectItem>
                      <SelectItem value="2">2 Copies</SelectItem>
                      <SelectItem value="3">3 Copies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stub-printer" className="flex items-center"><MonitorSmartphone className="mr-2 h-4 w-4 text-muted-foreground" /> Default Stub/Tag Printer</Label>
                  <Select value={stubPrinter} onValueChange={setStubPrinter}>
                    <SelectTrigger id="stub-printer" className="mt-1">
                      <SelectValue placeholder="Select stub/tag printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dotmatrix_76mm">Dot Matrix (76mm)</SelectItem>
                      <SelectItem value="thermal_80mm">Thermal Printer (80mm - for labels)</SelectItem>
                       <SelectItem value="a4_letter_sticker">A4/Letter (Sticker Sheet)</SelectItem>
                      <SelectItem value="none">None (Manual/No Print)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="receipt-header">Receipt Header Text</Label>
                <Textarea id="receipt-header" value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} placeholder="e.g., Your Company Name - Address - Phone" className="mt-1" rows={2}/>
                <p className="text-xs text-muted-foreground mt-1">
                    Can be auto-generated from Company Settings (future implementation) or customized here.
                </p>
              </div>
              <div>
                <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
                <Textarea id="receipt-footer" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="e.g., Thank you! Visit us again at www.example.com" className="mt-1" rows={2}/>
              </div>

              <Button onClick={handleSavePrinterSettings}>Save Printer Settings</Button>
               <p className="text-xs text-muted-foreground pt-4">
                Note: These are UI placeholders. Actual printer selection and control requires system-level integration.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companyRegional" className="mt-6">
         <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Building className="mr-2 h-6 w-6" /> Company &amp; Regional Settings
              </CardTitle>
              <UiCardDescription>Manage company details, system currency, language, and tax settings. (UI Placeholders)</UiCardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {companyLogoUrl ? (
                    <Image
                      src={companyLogoUrl}
                      alt="Company Logo Placeholder"
                      width={150}
                      height={50}
                      className="rounded-md border object-contain"
                      data-ai-hint="company logo"
                    />
                  ) : (
                    <div className="w-[150px] h-[50px] flex items-center justify-center rounded-md border border-dashed text-muted-foreground">
                      No Logo
                    </div>
                  )}
                  <Button variant="outline" onClick={handleLogoUploadPlaceholder}>
                    <ImageUp className="mr-2 h-4 w-4" /> Upload / Change Logo
                  </Button>
                </div>
                <FormDescription className="text-xs">
                  Placeholder for logo upload. Actual file upload requires backend integration.
                </FormDescription>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company Ltd." className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="company-phone">Company Phone</Label>
                    <Input id="company-phone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="(555) 123-4567" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="company-address">Company Address</Label>
                <Textarea id="company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="123 Main St, City, Country" className="mt-1" rows={3}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="vat-tax-id">VAT / Tax ID Number</Label>
                  <Input id="vat-tax-id" value={vatTaxId} onChange={(e) => setVatTaxId(e.target.value)} placeholder="e.g., GB123456789" className="mt-1" />
                </div>
                 <div>
                  <Label htmlFor="vat-sales-tax-rate">VAT / Sales Tax Rate (%)</Label>
                  <Input id="vat-sales-tax-rate" type="number" value={vatSalesTaxRate} onChange={(e) => setVatSalesTaxRate(e.target.value)} placeholder="e.g., 20" className="mt-1" />
                </div>
              </div>
               <div className="flex items-center space-x-2">
                <Switch id="include-vat" checked={includeVatInPrices} onCheckedChange={setIncludeVatInPrices} />
                <Label htmlFor="include-vat">Include VAT / Sales Tax in Displayed Service Prices</Label>
              </div>

              <div className="border-t pt-6 space-y-2">
                <h3 className="text-md font-medium text-muted-foreground">Regional Preferences</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="system-currency" className="flex items-center"><Landmark className="mr-2 h-4 w-4 text-muted-foreground" /> System Currency</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger id="system-currency" className="mt-1">
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
                </div>
                <div>
                  <Label htmlFor="system-language" className="flex items-center"><Globe className="mr-2 h-4 w-4 text-muted-foreground" /> Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger id="system-language" className="mt-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español (Spanish)</SelectItem>
                      <SelectItem value="fr">Français (French)</SelectItem>
                      <SelectItem value="de">Deutsch (German)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveCompanyRegionalSettings}>Save Company &amp; Regional Settings</Button>
               <p className="text-xs text-muted-foreground pt-4">
                Note: These settings are currently UI placeholders. Full integration requires backend support.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
    
