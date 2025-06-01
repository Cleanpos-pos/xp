export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  orderHistory?: Order[];
  createdAt: Date;
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

export type Order = {
  id: string;
  orderNumber: string; // User-friendly order number, e.g., "XP-001023"
  customerId: string;
  customerName: string; // Denormalized for quick display
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  notes?: string; // General order notes
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string; // e.g., "liters", "kg", "pieces"
  lowStockThreshold?: number;
  lastRestocked?: Date;
};

export type ReportData = {
  sales: number;
  orderVolume: number;
  // Add more metrics as needed
};
