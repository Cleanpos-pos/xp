
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
