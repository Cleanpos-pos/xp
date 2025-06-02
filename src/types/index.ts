
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
  created_at: string | null; // Changed from string
  updated_at: string | null; // Changed from string
};

export type ServiceItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
};

export type OrderItem = {
  id: string;
  serviceItemId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
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
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  created_at: string;
  updated_at: string;
  dueDate?: string;
  notes?: string;
  isExpress?: boolean; // Added for express orders
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold?: number;
  lastRestocked?: string;
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
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

// For displaying hierarchy in UI
export interface CatalogHierarchyNode extends CatalogEntry {
  children: CatalogHierarchyNode[];
}

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
  created_at?: string;
  updated_at?: string;
}
