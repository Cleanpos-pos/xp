

"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormItem as RHFFormItem,
  FormLabel as RHFFormLabel,
  FormMessage,
  FormField, // Ensure FormField is imported
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { type AddStaffInput, AddStaffSchema } from "./settings.schema";
import { addStaffAction, getAllStaffAction, toggleQuickLoginAction, removeStaffAction, toggleStaffActiveStatusAction } from "./actions";
import { getCompanySettingsAction, updateCompanySettingsAction } from "./company-settings-actions";
import { getPrinterSettingsAction, updatePrinterSettingsAction } from "./printer-settings-actions"; 
import { getSpecialOffersAction, upsertSpecialOfferAction } from "./special-offers-actions"; // Import special offer actions
import type { CompanySettings, DaySchedule, PrinterSettings, SpecialOffer, SpecialOfferTypeIdentifier, StaffCredentials, TimeSlot, UserRole, SmallTagPrintSettings } from "@/types"; 
import { useToast } from "@/hooks/use-toast";
import { Users, Cog, KeyRound, ShoppingBasket, DollarSign, Globe, Landmark, UserCog, ShieldCheck, ShieldAlert, ShieldQuestion, ListPlus, PrinterIcon, SettingsIcon, MonitorSmartphone, Percent, Gift, CalendarIcon, Building, ImageUp, Contact, Trash2, UserCheckIcon, UserXIcon, InfoIcon, Truck, PlusCircle, Clock, Trash, Tag } from "lucide-react";
import Link from 'next/link';
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CatalogManagementTab } from "@/components/settings/catalog-management";
import { CashUpManagementTab } from "@/components/settings/cash-up-tab";
import { CustomerManagementTab } from "@/components/settings/customer-management-tab";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const FormLabel = RHFFormLabel;
const FormItem = RHFFormItem;


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

const userRoles: UserRole[] = ["clerk", "admin", "super_admin"];
const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];


export default function SettingsPage() {
  const { toast } = useToast();
  const [staffList, setStaffList] = React.useState<StaffCredentials[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(true);
  const [staffToRemove, setStaffToRemove] = React.useState<StaffCredentials | null>(null);
  const [isRemoveStaffDialogOpen, setIsRemoveStaffDialogOpen] = React.useState(false);


  // Company & Regional Settings State
  const [isLoadingCompanySettings, setIsLoadingCompanySettings] = React.useState(true);
  const [isSavingCompanySettings, setIsSavingCompanySettings] = React.useState(false);
  
  const [companyName, setCompanyName] = React.useState<string>("");
  const [companyAddress, setCompanyAddress] = React.useState<string>("");
  const [companyPhone, setCompanyPhone] = React.useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = React.useState<string | null>(null);
  const [vatTaxId, setVatTaxId] = React.useState<string>("");
  const [vatSalesTaxRate, setVatSalesTaxRate] = React.useState<string>("0");
  const [includeVatInPrices, setIncludeVatInPrices] = React.useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("GBP");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("en");
  
  // Scheduling Settings State
  const [collectionSchedule, setCollectionSchedule] = React.useState<Record<string, DaySchedule>>({});
  const [deliverySchedule, setDeliverySchedule] = React.useState<Record<string, DaySchedule>>({});

  // Payment & Delivery Fee Settings State
  const [stripeConnectAccountId, setStripeConnectAccountId] = React.useState<string | null>(null);
  const [enablePlatformFeePassThrough, setEnablePlatformFeePassThrough] = React.useState<boolean>(false);
  const [deliveryFeeBase, setDeliveryFeeBase] = React.useState<string>("0");
  const [deliveryFeePerMile, setDeliveryFeePerMile] = React.useState<string>("0");
  const [deliveryFeeMinimum, setDeliveryFeeMinimum] = React.useState<string>("0");


  // Printer Settings State
  const [isLoadingPrinterSettings, setIsLoadingPrinterSettings] = React.useState(true);
  const [isSavingPrinterSettings, setIsSavingPrinterSettings] = React.useState(false);
  const [receiptPrinter, setReceiptPrinter] = React.useState<string>("thermal_80mm");
  const [customerReceiptCopies, setCustomerReceiptCopies] = React.useState<string>("1");
  const [stubPrinter, setStubPrinter] = React.useState<string>("dotmatrix_76mm");
  const [receiptHeader, setReceiptHeader] = React.useState<string>("XP Clean - Your Town Branch");
  const [receiptFooter, setReceiptFooter] = React.useState<string>("Thank you for your business!");
  const [smallTagPrintSettings, setSmallTagPrintSettings] = React.useState<SmallTagPrintSettings>({
    show_order_number: true,
    show_due_date: true,
    show_item_name: true,
    show_store_name: false,
  });

  // Special Offers State
  const [isLoadingSpecialOffers, setIsLoadingSpecialOffers] = React.useState(true);
  const [isSavingBuyXGetYOffer, setIsSavingBuyXGetYOffer] = React.useState(false);
  const [isSavingBundleOffer, setIsSavingBundleOffer] = React.useState(false);
  const [isSavingSpendGetOffer, setIsSavingSpendGetOffer] = React.useState(false);

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
  const [spendGet_Notes, setSpendGet_Notes] = React.useState<string>("");
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

  const fetchCompanySettings = React.useCallback(async () => {
    setIsLoadingCompanySettings(true);
    try {
      const settings = await getCompanySettingsAction();
      if (settings) {
        setCompanyName(settings.company_name || "XP Clean Ltd.");
        setCompanyAddress(settings.company_address || "123 Clean Street, Suite 100, YourTown, YT 54321");
        setCompanyPhone(settings.company_phone || "(555) 123-4567");
        setCompanyLogoUrl(settings.company_logo_url || "https://placehold.co/150x50.png?text=Your+Logo");
        setVatTaxId(settings.vat_tax_id || "GB123456789");
        setVatSalesTaxRate(settings.vat_sales_tax_rate?.toString() || "20");
        setIncludeVatInPrices(settings.include_vat_in_prices !== undefined ? settings.include_vat_in_prices : true);
        setSelectedCurrency(settings.selected_currency || "GBP");
        setSelectedLanguage(settings.selected_language || "en");
        setCollectionSchedule(settings.available_collection_schedule || {});
        setDeliverySchedule(settings.available_delivery_schedule || {});
        
        setStripeConnectAccountId(settings.stripe_connect_account_id || null);
        setEnablePlatformFeePassThrough(settings.enable_platform_fee_pass_through || false);
        setDeliveryFeeBase(settings.delivery_fee_base_gbp?.toString() || "0");
        setDeliveryFeePerMile(settings.delivery_fee_per_mile_gbp?.toString() || "0");
        setDeliveryFeeMinimum(settings.delivery_fee_minimum_gbp?.toString() || "0");

      } else {
        // Set default values if no settings are found
        setCompanyName("XP Clean Ltd.");
        setCompanyAddress("123 Clean Street, Suite 100, YourTown, YT 54321");
        setCompanyPhone("(555) 123-4567");
        setCompanyLogoUrl("https://placehold.co/150x50.png?text=Your+Logo");
        setVatTaxId("GB123456789");
        setVatSalesTaxRate("20");
        setIncludeVatInPrices(true);
        setSelectedCurrency("GBP");
        setSelectedLanguage("en");
        setCollectionSchedule({});
        setDeliverySchedule({});
        setStripeConnectAccountId(null);
        setEnablePlatformFeePassThrough(false);
        setDeliveryFeeBase("0");
        setDeliveryFeePerMile("0");
        setDeliveryFeeMinimum("0");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load company settings.", variant: "destructive" });
    } finally {
      setIsLoadingCompanySettings(false);
    }
  }, [toast]);

  const fetchPrinterSettings = React.useCallback(async () => {
    setIsLoadingPrinterSettings(true);
    try {
      const settings = await getPrinterSettingsAction();
      if (settings) {
        setReceiptPrinter(settings.receipt_printer || "thermal_80mm");
        setCustomerReceiptCopies(settings.customer_receipt_copies || "1");
        setStubPrinter(settings.stub_printer || "dotmatrix_76mm");
        setReceiptHeader(settings.receipt_header || "XP Clean - Your Town Branch");
        setReceiptFooter(settings.receipt_footer || "Thank you for your business!");
        setSmallTagPrintSettings(settings.small_tag_print_settings || { show_order_number: true, show_due_date: true, show_item_name: true, show_store_name: false });
      } else {
        setReceiptPrinter("thermal_80mm");
        setCustomerReceiptCopies("1");
        setStubPrinter("dotmatrix_76mm");
        setReceiptHeader("XP Clean - Your Town Branch");
        setReceiptFooter("Thank you for your business!");
        setSmallTagPrintSettings({ show_order_number: true, show_due_date: true, show_item_name: true, show_store_name: false });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load printer settings.", variant: "destructive" });
    } finally {
      setIsLoadingPrinterSettings(false);
    }
  }, [toast]);

  const fetchSpecialOffers = React.useCallback(async () => {
    setIsLoadingSpecialOffers(true);
    try {
      const offers = await getSpecialOffersAction();
      offers.forEach(offer => {
        switch (offer.offer_type_identifier) {
          case 'BUY_X_GET_Y':
            setBuyXgetY_X(offer.buy_x_items?.toString() || "3");
            setBuyXgetY_Y(offer.pay_for_y_items?.toString() || "2");
            setBuyXgetY_Active(offer.is_active || false);
            setBuyXgetY_ValidFrom(offer.valid_from ? parseISO(offer.valid_from) : undefined);
            setBuyXgetY_ValidTo(offer.valid_to ? parseISO(offer.valid_to) : undefined);
            setBuyXgetY_Notes(offer.notes || "");
            break;
          case 'BUNDLE_DEAL':
            setBundle_Items(offer.bundle_item_count?.toString() || "2");
            setBundle_Price(offer.bundle_price?.toFixed(2) || "10.00");
            setBundle_Active(offer.is_active || false);
            setBundle_ValidFrom(offer.valid_from ? parseISO(offer.valid_from) : undefined);
            setBundle_ValidTo(offer.valid_to ? parseISO(offer.valid_to) : undefined);
            setBundle_Notes(offer.notes || "");
            break;
          case 'SPEND_GET_FREE_ITEM':
            setSpendGet_Threshold(offer.spend_threshold?.toFixed(2) || "50.00");
            setSpendGet_FreeItemDesc(offer.free_item_description || "1 Free Shirt Press");
            setSpendGet_Active(offer.is_active || false);
            setSpendGet_ValidFrom(offer.valid_from ? parseISO(offer.valid_from) : undefined);
            setSpendGet_ValidTo(offer.valid_to ? parseISO(offer.valid_to) : undefined);
            setSpendGet_Notes(offer.notes || "");
            break;
        }
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to load special offers.", variant: "destructive" });
    } finally {
      setIsLoadingSpecialOffers(false);
    }
  }, [toast]);


  React.useEffect(() => {
    fetchStaff();
    fetchCompanySettings();
    fetchPrinterSettings();
    fetchSpecialOffers();
  }, [fetchStaff, fetchCompanySettings, fetchPrinterSettings, fetchSpecialOffers]);

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

  const handleStaffActiveToggle = async (login_id: string, isActive: boolean) => {
    const result = await toggleStaffActiveStatusAction({ loginId: login_id, isActive });
    if (result.success) {
      toast({ title: "Staff Status Updated", description: result.message });
      setStaffList(prevList =>
        prevList.map(staff =>
          staff.login_id === login_id ? { ...staff, is_active: isActive } : staff
        )
      );
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleOpenRemoveStaffDialog = (staff: StaffCredentials) => {
    setStaffToRemove(staff);
    setIsRemoveStaffDialogOpen(true);
  };

  const handleConfirmRemoveStaff = async () => {
    if (!staffToRemove) return;
    const result = await removeStaffAction(staffToRemove.login_id);
    if (result.success) {
      toast({ title: "Staff Removed", description: result.message });
      fetchStaff(); 
    } else {
      toast({ title: "Error", description: result.message || "Failed to remove staff.", variant: "destructive" });
    }
    setIsRemoveStaffDialogOpen(false);
    setStaffToRemove(null);
  };

  const handleSaveCompanySettings = async () => {
    setIsSavingCompanySettings(true);
    const settingsToSave: CompanySettings = {
      id: 'global_settings', 
      company_name: companyName,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_logo_url: companyLogoUrl,
      vat_tax_id: vatTaxId,
      vat_sales_tax_rate: parseFloat(vatSalesTaxRate) || 0,
      include_vat_in_prices: includeVatInPrices,
      selected_currency: selectedCurrency,
      selected_language: selectedLanguage,
      available_collection_schedule: collectionSchedule,
      available_delivery_schedule: deliverySchedule,
      stripe_connect_account_id: stripeConnectAccountId,
      enable_platform_fee_pass_through: enablePlatformFeePassThrough,
      delivery_fee_base_gbp: parseFloat(deliveryFeeBase) || 0,
      delivery_fee_per_mile_gbp: parseFloat(deliveryFeePerMile) || 0,
      delivery_fee_minimum_gbp: parseFloat(deliveryFeeMinimum) || 0,
    };
    const result = await updateCompanySettingsAction(settingsToSave);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: result.message || "Company & Regional settings updated successfully.",
      });
      fetchCompanySettings(); 
    } else {
      toast({
        title: "Error Saving Settings",
        description: result.message || "Failed to update company settings.",
        variant: "destructive",
      });
    }
    setIsSavingCompanySettings(false);
  };

  const handleSavePrinterSettings = async () => {
    setIsSavingPrinterSettings(true);
    const settingsToSave: PrinterSettings = {
      id: 'global_printer_settings', 
      receipt_printer: receiptPrinter,
      customer_receipt_copies: customerReceiptCopies,
      stub_printer: stubPrinter,
      receipt_header: receiptHeader,
      receipt_footer: receiptFooter,
      small_tag_print_settings: smallTagPrintSettings,
    };
    const result = await updatePrinterSettingsAction(settingsToSave);
    if (result.success) {
      toast({
        title: "Printer Settings Saved",
        description: result.message || "Printer settings updated successfully.",
      });
      fetchPrinterSettings(); 
    } else {
      toast({
        title: "Error Saving Printer Settings",
        description: result.message || "Failed to update printer settings.",
        variant: "destructive",
      });
    }
    setIsSavingPrinterSettings(false);
  };

  const handleSaveSpecialOffer = async (offerTypeIdentifier: SpecialOfferTypeIdentifier) => {
    let offerData: Omit<SpecialOffer, 'id' | 'created_at' | 'updated_at'>;
    let setIsSavingState: React.Dispatch<React.SetStateAction<boolean>>;

    switch (offerTypeIdentifier) {
      case 'BUY_X_GET_Y':
        setIsSavingState = setIsSavingBuyXGetYOffer;
        offerData = {
          offer_type_identifier: 'BUY_X_GET_Y',
          buy_x_items: parseInt(buyXgetY_X) || undefined,
          pay_for_y_items: parseInt(buyXgetY_Y) || undefined,
          is_active: buyXgetY_Active,
          valid_from: buyXgetY_ValidFrom ? buyXgetY_ValidFrom.toISOString() : null,
          valid_to: buyXgetY_ValidTo ? buyXgetY_ValidTo.toISOString() : null,
          notes: buyXgetY_Notes,
        };
        break;
      case 'BUNDLE_DEAL':
        setIsSavingState = setIsSavingBundleOffer;
        offerData = {
          offer_type_identifier: 'BUNDLE_DEAL',
          bundle_item_count: parseInt(bundle_Items) || undefined,
          bundle_price: parseFloat(bundle_Price) || undefined,
          is_active: bundle_Active,
          valid_from: bundle_ValidFrom ? bundle_ValidFrom.toISOString() : null,
          valid_to: bundle_ValidTo ? bundle_ValidTo.toISOString() : null,
          notes: bundle_Notes,
        };
        break;
      case 'SPEND_GET_FREE_ITEM':
        setIsSavingState = setIsSavingSpendGetOffer;
        offerData = {
          offer_type_identifier: 'SPEND_GET_FREE_ITEM',
          spend_threshold: parseFloat(spendGet_Threshold) || undefined,
          free_item_description: spendGet_FreeItemDesc,
          is_active: spendGet_Active,
          valid_from: spendGet_ValidFrom ? spendGet_ValidFrom.toISOString() : null,
          valid_to: spendGet_ValidTo ? spendGet_ValidTo.toISOString() : null,
          notes: spendGet_Notes,
        };
        break;
      default:
        toast({ title: "Error", description: "Unknown offer type.", variant: "destructive" });
        return;
    }

    setIsSavingState(true);
    const result = await upsertSpecialOfferAction(offerData);
    if (result.success) {
      toast({ title: "Special Offer Saved", description: result.message });
      fetchSpecialOffers(); // Re-fetch to update UI if needed (e.g., with new IDs or timestamps)
    } else {
      toast({ title: "Error Saving Offer", description: result.message, variant: "destructive" });
    }
    setIsSavingState(false);
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
    });
  };

  const handleScheduleChange = (
    type: 'collection' | 'delivery',
    day: string,
    field: 'is_active' | 'update_slot' | 'add_slot' | 'remove_slot',
    value: any,
    slotId?: string
  ) => {
    const setSchedule = type === 'collection' ? setCollectionSchedule : setDeliverySchedule;
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const daySchedule = newSchedule[day] || { is_active: false, slots: [] };

      if (field === 'is_active') {
        daySchedule.is_active = value as boolean;
        if (!daySchedule.is_active) {
            daySchedule.slots = []; // Clear slots if day is deactivated
        }
      } else if (field === 'add_slot') {
        daySchedule.slots.push({ id: crypto.randomUUID(), time_range: '09:00-11:00', max_orders: 10 });
      } else if (field === 'remove_slot' && slotId) {
        daySchedule.slots = daySchedule.slots.filter(slot => slot.id !== slotId);
      } else if (field === 'update_slot' && slotId) {
        daySchedule.slots = daySchedule.slots.map(slot =>
          slot.id === slotId ? { ...slot, ...value } : slot
        );
      }
      
      newSchedule[day] = daySchedule;
      return newSchedule;
    });
  };
  
  const handleSmallTagSettingChange = (key: keyof SmallTagPrintSettings, value: boolean) => {
    setSmallTagPrintSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };


  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="flex items-center justify-between print-hidden settings-page-title-print-hidden">
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

      <Tabs defaultValue="staffManagement" className="w-full print-hidden settings-tabs-print-hidden">
        <div className="flex flex-col gap-2 print-hidden">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto flex-wrap">
            <TabsTrigger value="staffManagement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              <Users className="mr-1.5 h-4 w-4" /> Staff
            </TabsTrigger>
            <TabsTrigger value="rolesPermissions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              Roles
            </TabsTrigger>
            <TabsTrigger value="customerManagement" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              <Contact className="mr-1.5 h-4 w-4" />Customers
            </TabsTrigger>
            <TabsTrigger value="itemCatalog" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              Catalog
            </TabsTrigger>
            <TabsTrigger value="orderStatus" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              Order Status
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto flex-wrap">
            <TabsTrigger value="scheduling" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
                <Truck className="mr-1.5 h-4 w-4" /> Scheduling
            </TabsTrigger>
            <TabsTrigger value="specialOffers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              <Percent className="mr-1.5 h-4 w-4" /> Offers
            </TabsTrigger>
            <TabsTrigger value="cashUp" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              Cash Up
            </TabsTrigger>
            <TabsTrigger value="printerSetup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
              Printers
            </TabsTrigger>
            <TabsTrigger value="companyRegional" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-accent/30 data-[state=inactive]:hover:text-accent-foreground">
             <Building className="mr-1.5 h-4 w-4" /> Company
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="staffManagement" className="mt-6 space-y-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Users className="mr-2 h-6 w-6" /> Add New Staff
              </CardTitle>
              <CardDescription>Add new staff members to the system (uses Supabase). Ensure you have added 'role' and 'is_active' columns to your 'staff' table in Supabase.</CardDescription>
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
                         <p className="text-sm text-muted-foreground">
                          NOTE: Passwords are NOT hashed in this prototype. Implement hashing for production.
                        </p>
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
                <KeyRound className="mr-2 h-6 w-6" /> Manage Staff
              </CardTitle>
              <CardDescription>View staff roles, toggle quick login, active status, or remove staff (uses Supabase).</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : staffList.length > 0 ? (
                <ul className="space-y-4">
                  {staffList.map((staff) => (
                    <li key={staff.login_id} className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md bg-background shadow-sm gap-4", !staff.is_active && "opacity-60 bg-muted/50")}>
                      <div className="flex flex-col">
                        <p className={cn("font-medium", !staff.is_active && "line-through")}>{staff.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {staff.login_id}</p>
                         <Badge variant={getRoleBadgeVariant(staff.role || 'clerk')} className="w-fit mt-1 capitalize">
                          {staff.role ? staff.role.replace('_', ' ') : 'Clerk'}
                        </Badge>
                         {!staff.is_active && <Badge variant="outline" className="w-fit mt-1 text-destructive border-destructive">Inactive</Badge>}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 justify-between w-full sm:w-auto">
                          <Label htmlFor={`active-status-${staff.login_id}`} className="text-sm whitespace-nowrap flex items-center">
                            {staff.is_active ? <UserCheckIcon className="mr-1.5 h-4 w-4 text-green-600" /> : <UserXIcon className="mr-1.5 h-4 w-4 text-red-600" />}
                            Active
                          </Label>
                          <Switch
                            id={`active-status-${staff.login_id}`}
                            checked={!!staff.is_active}
                            onCheckedChange={(checked) => handleStaffActiveToggle(staff.login_id, checked)}
                            aria-label={`Toggle active status for ${staff.name}`}
                          />
                        </div>
                        <div className="flex items-center space-x-2 justify-between w-full sm:w-auto">
                          <Label htmlFor={`quick-login-${staff.login_id}`} className="text-sm whitespace-nowrap">
                            Quick Login
                          </Label>
                          <Switch
                            id={`quick-login-${staff.login_id}`}
                            checked={!!staff.enable_quick_login}
                            onCheckedChange={(checked) => handleQuickLoginToggle(staff.login_id, checked)}
                            aria-label={`Enable quick login for ${staff.name}`}
                            disabled={!staff.is_active}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleOpenRemoveStaffDialog(staff)}
                          aria-label={`Remove staff member ${staff.name}`}
                        >
                          <Trash2 className="mr-0 sm:mr-1.5 h-4 w-4" /> <span className="sm:hidden">Remove</span>
                        </Button>
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
              <CardDescription>This section outlines the capabilities of different user roles. Actual enforcement of these permissions requires further development.</CardDescription>
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
              <p className={cn("text-muted-foreground", "text-xs")}>
                Note: Assigning roles is now possible when adding staff. However, the actual restriction of access based on these roles (e.g., hiding buttons, preventing actions) is not yet implemented in this prototype and would require further development across the application.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="customerManagement" className="mt-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Contact className="mr-2 h-6 w-6" /> Customer Account Management
              </CardTitle>
              <CardDescription>View and manage customer account settings like invoice status and account ID.</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerManagementTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itemCatalog" className="mt-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <ShoppingBasket className="mr-2 h-6 w-6" /> Service &amp; Item Catalog Management
              </CardTitle>
              <CardDescription>Organize your services and items into hierarchical categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <CatalogManagementTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orderStatus" className="mt-6">
          <Card className="shadow-xl">
             <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center">
                <ListPlus className="mr-2 h-6 w-6" /> Quick Order Status Updates
                </CardTitle>
                <CardDescription>
                Quickly update order statuses, especially for marking items as "Ready for Pickup".
                This section will use the &lt;OrderStatusUpdateTab /&gt; component once it is created.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Order status update interface will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduling" className="mt-6 space-y-6">
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center">
                        <Truck className="mr-2 h-5 w-5 text-primary" /> Online Order Scheduling
                    </CardTitle>
                    <CardDescription>
                        Define available days, time slots, and order limits for customer collections and deliveries.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingCompanySettings ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <Tabs defaultValue="collection" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="collection">Collection Schedule</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery Schedule</TabsTrigger>
                      </TabsList>
                      <TabsContent value="collection" className="mt-4 space-y-4">
                        {daysOfWeek.map(day => (
                          <Card key={`coll-${day}`} className="p-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`coll-active-${day}`} className="text-lg font-medium capitalize">{day}</Label>
                              <Switch
                                id={`coll-active-${day}`}
                                checked={collectionSchedule[day]?.is_active || false}
                                onCheckedChange={(checked) => handleScheduleChange('collection', day, 'is_active', checked)}
                              />
                            </div>
                            {collectionSchedule[day]?.is_active && (
                              <div className="mt-4 pl-2 space-y-3">
                                {(collectionSchedule[day].slots || []).map((slot, index) => (
                                  <div key={slot.id} className="flex items-center gap-2">
                                    <Input
                                      value={slot.time_range}
                                      onChange={(e) => handleScheduleChange('collection', day, 'update_slot', { time_range: e.target.value }, slot.id)}
                                      placeholder="e.g., 09:00-11:00"
                                      className="w-1/2"
                                    />
                                    <Input
                                      type="number"
                                      value={slot.max_orders}
                                      onChange={(e) => handleScheduleChange('collection', day, 'update_slot', { max_orders: parseInt(e.target.value, 10) || 0 }, slot.id)}
                                      placeholder="Max Orders"
                                      className="w-1/3"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleScheduleChange('collection', day, 'remove_slot', null, slot.id)}>
                                      <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => handleScheduleChange('collection', day, 'add_slot', null)}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Time Slot
                                </Button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </TabsContent>
                      <TabsContent value="delivery" className="mt-4 space-y-4">
                      {daysOfWeek.map(day => (
                          <Card key={`del-${day}`} className="p-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`del-active-${day}`} className="text-lg font-medium capitalize">{day}</Label>
                              <Switch
                                id={`del-active-${day}`}
                                checked={deliverySchedule[day]?.is_active || false}
                                onCheckedChange={(checked) => handleScheduleChange('delivery', day, 'is_active', checked)}
                              />
                            </div>
                            {deliverySchedule[day]?.is_active && (
                              <div className="mt-4 pl-2 space-y-3">
                                {(deliverySchedule[day].slots || []).map((slot, index) => (
                                  <div key={slot.id} className="flex items-center gap-2">
                                    <Input
                                      value={slot.time_range}
                                      onChange={(e) => handleScheduleChange('delivery', day, 'update_slot', { time_range: e.target.value }, slot.id)}
                                      placeholder="e.g., 09:00-11:00"
                                      className="w-1/2"
                                    />
                                    <Input
                                      type="number"
                                      value={slot.max_orders}
                                      onChange={(e) => handleScheduleChange('delivery', day, 'update_slot', { max_orders: parseInt(e.target.value, 10) || 0 }, slot.id)}
                                      placeholder="Max Orders"
                                      className="w-1/3"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleScheduleChange('delivery', day, 'remove_slot', null, slot.id)}>
                                      <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => handleScheduleChange('delivery', day, 'add_slot', null)}>
                                  <PlusCircle className="mr-2 h-4 w-4" /> Add Time Slot
                                </Button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveCompanySettings} disabled={isSavingCompanySettings}>
                        {isSavingCompanySettings ? "Saving Schedule..." : "Save Scheduling Settings"}
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="specialOffers" className="mt-6 space-y-6">
          {isLoadingSpecialOffers ? (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <>
            <Card className="shadow-xl">
                <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <Gift className="mr-2 h-5 w-5 text-green-600" /> "Buy X Get Y (Cheapest Free)" Offer
                </CardTitle>
                <CardDescription>Configure a "cheapest item free" type of promotion. Saved to Supabase.</CardDescription>
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
                        <Calendar mode="single" selected={buyXgetY_ValidFrom} onSelect={(date) => { setBuyXgetY_ValidFrom(date || undefined); setIsBuyXgetYFromCalendarOpen(false);}} initialFocus />
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
                        <Calendar mode="single" selected={buyXgetY_ValidTo} onSelect={(date) => { setBuyXgetY_ValidTo(date || undefined); setIsBuyXgetYToCalendarOpen(false);}} disabled={(date) => buyXgetY_ValidFrom ? date < buyXgetY_ValidFrom : false} initialFocus />
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
                <Button onClick={() => handleSaveSpecialOffer('BUY_X_GET_Y')} disabled={isSavingBuyXGetYOffer}>
                    {isSavingBuyXGetYOffer ? "Saving..." : "Save 'Buy X Get Y' Settings"}
                </Button>
                </CardContent>
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <Percent className="mr-2 h-5 w-5 text-blue-600" /> "Bundle Deal (X Items for Price Y)"
                </CardTitle>
                <CardDescription>Set a fixed price for a bundle of items. Saved to Supabase.</CardDescription>
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
                        <Calendar mode="single" selected={bundle_ValidFrom} onSelect={(date) => { setBundle_ValidFrom(date || undefined); setIsBundleFromCalendarOpen(false);}} initialFocus />
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
                        <Calendar mode="single" selected={bundle_ValidTo} onSelect={(date) => { setBundle_ValidTo(date || undefined); setIsBundleToCalendarOpen(false);}} disabled={(date) => bundle_ValidFrom ? date < bundle_ValidFrom : false} initialFocus />
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
                <Button onClick={() => handleSaveSpecialOffer('BUNDLE_DEAL')} disabled={isSavingBundleOffer}>
                    {isSavingBundleOffer ? "Saving..." : "Save 'Bundle Deal' Settings"}
                </Button>
                </CardContent>
            </Card>

            <Card className="shadow-xl">
                <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-yellow-500" /> "Spend &amp; Get Free Item" Offer
                </CardTitle>
                <CardDescription>Offer a free item when a customer spends a certain amount. Saved to Supabase.</CardDescription>
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
                        <Calendar mode="single" selected={spendGet_ValidFrom} onSelect={(date) => { setSpendGet_ValidFrom(date || undefined); setIsSpendGetFromCalendarOpen(false);}} initialFocus />
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
                        <Calendar mode="single" selected={spendGet_ValidTo} onSelect={(date) => { setSpendGet_ValidTo(date || undefined); setIsSpendGetToCalendarOpen(false);}} disabled={(date) => spendGet_ValidFrom ? date < spendGet_ValidFrom : false} initialFocus />
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
                <Button onClick={() => handleSaveSpecialOffer('SPEND_GET_FREE_ITEM')} disabled={isSavingSpendGetOffer}>
                    {isSavingSpendGetOffer ? "Saving..." : "Save 'Spend & Get' Settings"}
                </Button>
                </CardContent>
                <CardFooter>
                    <p className={cn("text-muted-foreground", "text-xs")}>
                        Note: The parameters set here are for configuration purposes. Applying these offers to orders requires additional logic in the order creation process.
                    </p>
                </CardFooter>
            </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="cashUp" className="mt-6 print-this-specific-area">
          <Card className="shadow-xl print-no-break">
            <CardContent className="p-0 sm:p-6">
              <CashUpManagementTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printerSetup" className="mt-6 space-y-6">
         <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <PrinterIcon className="mr-2 h-6 w-6" /> Printer Setup
              </CardTitle>
              <CardDescription>Configure default printers and receipt templates. Settings are saved to Supabase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingPrinterSettings ? (
                 <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 text-blue-700">
                    <div className="flex items-start">
                      <InfoIcon className="mr-3 h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Important Notes on Printing:</h4>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                          <li>This application uses your browser's print functionality.</li>
                          <li>Ensure your printers (e.g., receipt printer, tag printer) are correctly installed and configured in your computer's Operating System (Windows, macOS, etc.).</li>
                          <li>When the print dialog appears, you must select the correct printer and appropriate paper size (e.g., 80mm roll for thermal receipts).</li>
                          <li>The application styles content for printing, but direct printer control is managed by your browser and OS.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

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
                        This will be displayed at the top of printed receipts.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
                    <Textarea id="receipt-footer" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="e.g., Thank you! Visit us again at www.example.com" className="mt-1" rows={2}/>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSavePrinterSettings} disabled={isSavingPrinterSettings}>
                    {isSavingPrinterSettings ? "Saving..." : "Save General Printer Settings"}
                </Button>
            </CardFooter>
          </Card>
          <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                    <Tag className="mr-2 h-5 w-5" /> Small Tag Content
                </CardTitle>
                <CardDescription>Choose which details to print on the small item tags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {isLoadingPrinterSettings ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                 ) : (
                    <>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="tag-show-number" className="text-sm">Show Order Number</Label>
                            <Switch id="tag-show-number" checked={smallTagPrintSettings.show_order_number} onCheckedChange={(checked) => handleSmallTagSettingChange('show_order_number', checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="tag-show-date" className="text-sm">Show Due Date</Label>
                            <Switch id="tag-show-date" checked={smallTagPrintSettings.show_due_date} onCheckedChange={(checked) => handleSmallTagSettingChange('show_due_date', checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="tag-show-item" className="text-sm">Show Item Name</Label>
                            <Switch id="tag-show-item" checked={smallTagPrintSettings.show_item_name} onCheckedChange={(checked) => handleSmallTagSettingChange('show_item_name', checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="tag-show-store" className="text-sm">Show Store Name</Label>
                            <Switch id="tag-show-store" checked={smallTagPrintSettings.show_store_name} onCheckedChange={(checked) => handleSmallTagSettingChange('show_store_name', checked)} />
                        </div>
                    </>
                 )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSavePrinterSettings} disabled={isSavingPrinterSettings}>
                    {isSavingPrinterSettings ? "Saving..." : "Save Tag Settings"}
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="companyRegional" className="mt-6 space-y-6">
         <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Building className="mr-2 h-6 w-6" /> Company Information
              </CardTitle>
              <CardDescription>Manage your main company details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingCompanySettings ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
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
                    <p className={cn("text-muted-foreground", "text-xs")}>
                      Placeholder for logo upload. Actual file upload requires backend integration.
                    </p>
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
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center"><Globe className="mr-2 h-5 w-5" /> Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoadingCompanySettings ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                <>
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
                  <div className="border-t pt-6"></div>
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
                </>
              )}
            </CardContent>
          </Card>

           <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center">
                <Landmark className="mr-2 h-5 w-5 text-purple-600" /> Stripe Connect & Platform Fees
              </CardTitle>
              <CardDescription>
                Connect your Stripe account to process payments. Platform fees of £1.50 + a percentage apply to each order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingCompanySettings ? <Skeleton className="h-24 w-full" /> : (
                <>
                  <div>
                      <Label htmlFor="stripe-connect-id">Stripe Connect Account ID</Label>
                      <Input id="stripe-connect-id" value={stripeConnectAccountId || ""} onChange={(e) => setStripeConnectAccountId(e.target.value)} placeholder="acct_..." className="mt-1" disabled />
                      <p className="text-xs text-muted-foreground mt-1">This would be automatically populated after completing the Stripe Connect onboarding process.</p>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                      <Switch id="platform-fee-pass-through" checked={enablePlatformFeePassThrough} onCheckedChange={setEnablePlatformFeePassThrough} />
                      <Label htmlFor="platform-fee-pass-through">Pass Platform Fees to End Customer</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">If enabled, the platform fee will be added to the customer's final bill. Otherwise, it will be deducted from your payout.</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center">
                <Truck className="mr-2 h-5 w-5 text-green-600" /> Delivery Fee Configuration
              </CardTitle>
              <CardDescription>
                Set up mileage-based delivery fees for online orders. This requires an integration with a mapping service (e.g., Google Maps) to calculate distance, which is not yet implemented.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCompanySettings ? <Skeleton className="h-20 w-full" /> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                      <Label htmlFor="delivery-base-fee">Base Fee ({selectedCurrency})</Label>
                      <Input id="delivery-base-fee" type="number" step="0.01" value={deliveryFeeBase} onChange={(e) => setDeliveryFeeBase(e.target.value)} placeholder="e.g., 2.50" className="mt-1" />
                  </div>
                  <div>
                      <Label htmlFor="delivery-per-mile-fee">Fee Per Mile ({selectedCurrency})</Label>
                      <Input id="delivery-per-mile-fee" type="number" step="0.01" value={deliveryFeePerMile} onChange={(e) => setDeliveryFeePerMile(e.target.value)} placeholder="e.g., 0.50" className="mt-1" />
                  </div>
                  <div>
                      <Label htmlFor="delivery-minimum-fee">Minimum Fee ({selectedCurrency})</Label>
                      <Input id="delivery-minimum-fee" type="number" step="0.01" value={deliveryFeeMinimum} onChange={(e) => setDeliveryFeeMinimum(e.target.value)} placeholder="e.g., 3.00" className="mt-1" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSaveCompanySettings} disabled={isSavingCompanySettings} className="w-full sm:w-auto">
            {isSavingCompanySettings ? "Saving..." : "Save All Company Settings"}
          </Button>

        </TabsContent>

      </Tabs>

      {staffToRemove && (
        <AlertDialog open={isRemoveStaffDialogOpen} onOpenChange={setIsRemoveStaffDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Staff Removal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove staff member "{staffToRemove.name}" (Login ID: {staffToRemove.login_id})? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsRemoveStaffDialogOpen(false); setStaffToRemove(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemoveStaff} className={buttonVariants({ variant: "destructive" })}>
                Remove Staff
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
