

export type UserRole = 'clerk' | 'admin' | 'super_admin';

export type Customer = {
  id: string; // Supabase will typically generate this as UUID
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_status?: 'None' | 'Bronze' | 'Silver' | 'Gold';
  price_band?: 'Standard' | 'Band A' | 'Band B' | 'Band C';
  orderHistory?: Order[];
  created_at: string | null;
  updated_at: string | null;
  is_account_client?: boolean;
  account_id?: string | null; // Allow null for account_id
  sms_opt_in?: boolean;
  email_opt_in?: boolean;
  has_preferred_pricing?: boolean;
};

export type ServiceItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  has_color_identifier?: boolean;
};

export type OrderItem = {
  id: string;
  serviceItemId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number; // This will be the price after manual override, before item discounts
  originalUnitPrice?: number; // The price from the catalog/service item
  itemDiscountAmount?: number;
  itemDiscountPercentage?: number;
  totalPrice: number; // Effective total price for this line item after all its discounts/overrides
  notes?: string;
  has_color_identifier?: boolean; // From the service item
  color_value?: string; // User-entered color if has_color_identifier is true
  small_tags_to_print?: number;
};

export type OrderStatus =
  | "Received"
  | "Processing"
  | "Cleaning"
  | "Alterations"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

export type PaymentStatus =
  | "Paid"
  | "Unpaid"
  | "Processing Payment"
  | "Refunded";

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotalAmount?: number; // Sum of item totals before cart discounts
  cartDiscountAmount?: number;
  cartDiscountPercentage?: number;
  cartPriceOverride?: number; // If set, this is the final price
  totalAmount: number; // Final amount due after all calculations
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  created_at: string;
  updated_at: string;
  dueDate?: string;
  notes?: string;
  isExpress?: boolean; // Added for express orders
};

export type InventoryItem = {
  id: string; // UUID from Supabase
  name: string;
  quantity: number;
  unit: string;
  low_stock_threshold?: number;
  last_restocked_at?: string | null; // TIMESTAMPTZ from Supabase
  created_at: string; // TIMESTAMPTZ from Supabase
  updated_at: string; // TIMESTAMPTZ from Supabase
};

export type ReportData = {
  sales: number;
  orderVolume: number;
};

// New types for hierarchical catalog management
export type CatalogEntryType = 'category' | 'item';

export interface CatalogEntry {
  id: string;
  name: string;
  parent_id: string | null; // null for top-level categories, matches DB
  type: CatalogEntryType;
  price?: number; // For items
  description?: string; // For items or categories
  sort_order: number; // To handle manual sorting later
  has_color_identifier?: boolean; // For items, to prompt for color
  small_tags_to_print?: number; // For items, number of small tags
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

// For displaying hierarchy in UI
export interface CatalogHierarchyNode extends CatalogEntry {
  children: CatalogHierarchyNode[];
}

export type Payout = {
  id: string; // Unique ID for the payout
  sessionId?: string; // Links to CashUpSession ID if finalized with one
  timestamp: string; // ISO string
  amount: number;
  reason: string;
  finalizedBy: string; // Staff who recorded the payout
};

export type CashUpSession = {
  id: string; // Unique ID for the session, e.g., timestamp
  timestamp: string; // ISO string
  floatAmount: number;
  systemCash: number;
  actualCash: number;
  cashVariance: number;
  systemCard: number;
  actualCard: number;
  cardVariance: number;
  payouts?: Payout[]; // Payouts made during this session
  finalizedBy: string; // Placeholder for staff who did it
};

// This type is primarily used in mock-auth-store and settings related to staff
// It's partially duplicated here for wider use, can be consolidated later if needed.
export interface StaffCredentials {
  id?: string; // Supabase UUID
  name: string;
  login_id: string;
  hashed_password?: string;
  password?: string; // For input
  enable_quick_login?: boolean;
  role: UserRole; // Added user role
  is_active?: boolean; // Added for active status
  created_at?: string;
  updated_at?: string;
}

export interface TimeSlot {
  id: string; // e.g., a UUID for react keys
  time_range: string; // e.g., "09:00-11:00"
  max_orders: number;
}

export interface DaySchedule {
  is_active: boolean;
  slots: TimeSlot[];
}

export interface CompanySettings {
  id: string; // e.g., 'global_settings'
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_logo_url?: string | null;
  vat_tax_id?: string;
  vat_sales_tax_rate?: number;
  include_vat_in_prices?: boolean;
  selected_currency?: string;
  selected_language?: string;
  available_collection_schedule?: Record<string, DaySchedule>;
  available_delivery_schedule?: Record<string, DaySchedule>;
  // Stripe Connect & Platform Fees
  stripe_connect_account_id?: string | null;
  enable_platform_fee_pass_through?: boolean; // Let shop owner pass our fees to their customer
  // Delivery Fees (charged by shop to their customer)
  delivery_fee_base_gbp?: number;
  delivery_fee_per_mile_gbp?: number;
  delivery_fee_minimum_gbp?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SmallTagPrintSettings {
  show_order_number?: boolean;
  show_due_date?: boolean;
  show_item_name?: boolean;
  show_store_name?: boolean;
}

export interface PrinterSettings {
  id: string; // e.g., 'global_printer_settings'
  receipt_printer?: string;
  customer_receipt_copies?: string;
  stub_printer?: string;
  receipt_header?: string;
  receipt_footer?: string;
  small_tag_print_settings?: SmallTagPrintSettings; // New field for small tag content
  created_at?: string;
  updated_at?: string;
}


export type SpecialOfferTypeIdentifier = 'BUY_X_GET_Y' | 'BUNDLE_DEAL' | 'SPEND_GET_FREE_ITEM';

export interface SpecialOffer {
  id?: string; // UUID from Supabase, primary key. Optional for upsert.
  offer_type_identifier: SpecialOfferTypeIdentifier; // Unique key for matching UI to DB record
  is_active?: boolean;
  valid_from?: string | null; // ISO date string
  valid_to?: string | null; // ISO date string
  notes?: string | null;
  // Fields for "Buy X Get Y"
  buy_x_items?: number | null;
  pay_for_y_items?: number | null;
  // Fields for "Bundle Deal"
  bundle_item_count?: number | null;
  bundle_price?: number | null;
  // Fields for "Spend & Get"
  spend_threshold?: number | null;
  free_item_description?: string | null;
  created_at?: string;
  updated_at?: string;
}
