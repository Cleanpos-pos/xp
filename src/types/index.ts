
export type Customer = {
  id: string; // Supabase will typically generate this as UUID
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_status?: 'None' | 'Bronze' | 'Silver' | 'Gold'; // Changed to snake_case
  price_band?: 'Standard' | 'Band A' | 'Band B' | 'Band C'; // Changed to snake_case
  orderHistory?: Order[]; // This would need a separate table and relation in a real setup
  created_at: string; // Supabase returns ISO string
  updated_at: string; // Supabase returns ISO string
};

export type ServiceItem = {
  id: string;
  name: string; // e.g., "Men's Shirt", "Suit 2-Piece"
  description?: string;
  price: number;
  category: string; // e.g., "Dry Cleaning", "Laundry", "Alterations"
};

export type OrderItem = {
  id: string;
  serviceItemId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string; // e.g., "Heavy starch", "Repair left cuff"
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
  orderNumber: string; // User-friendly order number, e.g., "XP-001023"
  customerId: string;
  customerName: string; // Denormalized for quick display
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  created_at: string; // Supabase returns ISO string
  updated_at: string; // Supabase returns ISO string
  dueDate?: string; // Dates also likely ISO strings or need conversion
  notes?: string; // General order notes
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string; // e.g., "liters", "kg", "pieces"
  lowStockThreshold?: number;
  lastRestocked?: string; // Date
};

export type ReportData = {
  sales: number;
  orderVolume: number;
  // Add more metrics as needed
};

// Note: StaffCredentials interface moved to mock-auth-store.ts for co-location
// but conceptually it's a type that will be updated there to match DB.
    
