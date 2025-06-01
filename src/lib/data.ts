
import type { Order, Customer, ServiceItem, InventoryItem, OrderStatus, PaymentStatus, CatalogEntry, CatalogHierarchyNode } from '@/types';
import type { CreateCustomerInput } from '@/app/(app)/customers/new/customer.schema';
import { supabase } from './supabase';


// Define types for our global stores for mock data (non-customer, non-staff)
declare global {
  // eslint-disable-next-line no-var
  var mockServicesStore: ServiceItem[] | undefined;
  // eslint-disable-next-line no-var
  var mockOrdersStore: Order[] | undefined;
  // eslint-disable-next-line no-var
  var mockInventoryStore: InventoryItem[] | undefined;
  // eslint-disable-next-line no-var
  var mockCatalogEntriesStore: CatalogEntry[] | undefined;
}


const initialServices: ServiceItem[] = [
  { id: 'serv1', name: "Men's Shirt - Hanger", price: 3.50, category: 'Laundry' },
  { id: 'serv2', name: 'Suit 2-Piece', price: 15.00, category: 'Dry Cleaning' },
  { id: 'serv3', name: 'Dress - Plain', price: 12.00, category: 'Dry Cleaning' },
  { id: 'serv4', name: 'Pants Hemming', price: 10.00, category: 'Alterations' },
  { id: 'serv5', name: 'Comforter - Queen', price: 25.00, category: 'Dry Cleaning' },
  { id: 'serv6', name: "Women's Blouse", price: 7.00, category: 'Laundry' },
  { id: 'serv7', name: 'Tablecloth', price: 10.00, category: 'Specialty Items' },
  { id: 'serv8', name: 'Zipper Replacement', price: 18.00, category: 'Alterations' },
];

const generateOrderNumber = (index: number) => `XP-${String(1000 + index).padStart(6, '0')}`;

const initialOrders: Order[] = [
  {
    id: 'order1',
    orderNumber: generateOrderNumber(1),
    customerId: 'cust1',
    customerName: 'John Doe',
    items: [
      { id: 'item1', serviceItemId: 'serv1', serviceName: "Men's Shirt - Hanger", quantity: 5, unitPrice: 3.50, totalPrice: 17.50 },
      { id: 'item2', serviceItemId: 'serv2', serviceName: 'Suit 2-Piece', quantity: 1, unitPrice: 15.00, totalPrice: 15.00 },
    ],
    totalAmount: 32.50,
    status: 'Ready for Pickup' as OrderStatus,
    paymentStatus: 'Paid' as PaymentStatus,
    created_at: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    updated_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
  },
];

const initialInventory: InventoryItem[] = [
  { id: 'inv1', name: 'Dry Cleaning Solvent', quantity: 50, unit: 'liters', lowStockThreshold: 20, lastRestocked: new Date().toISOString() },
  { id: 'inv2', name: 'Hangers - Wire', quantity: 850, unit: 'pieces', lowStockThreshold: 200, lastRestocked: new Date().toISOString() },
  { id: 'inv3', name: 'Garment Bags - Clear', quantity: 400, unit: 'pieces', lowStockThreshold: 100, lastRestocked: new Date().toISOString() },
  { id: 'inv4', name: 'Laundry Detergent', quantity: 25, unit: 'kg', lowStockThreshold: 5, lastRestocked: new Date().toISOString() },
];

const initialCatalogEntries: CatalogEntry[] = [
  { id: 'cat_drycleaning', name: 'Dry Cleaning', parentId: null, type: 'category', sortOrder: 0, created_at: new Date().toISOString() },
  { id: 'cat_mens', name: 'Mens', parentId: 'cat_drycleaning', type: 'category', sortOrder: 0, created_at: new Date().toISOString() },
  { id: 'cat_womens', name: 'Womens', parentId: 'cat_drycleaning', type: 'category', sortOrder: 1, created_at: new Date().toISOString() },
  { id: 'item_mens_trousers_linen', name: 'Linen Trousers', parentId: 'cat_mens', type: 'item', price: 8.99, sortOrder: 0, description: 'Delicate linen trousers cleaning.', created_at: new Date().toISOString() },
  { id: 'item_mens_trousers_standard', name: 'Standard Trousers', parentId: 'cat_mens', type: 'item', price: 5.99, sortOrder: 1, created_at: new Date().toISOString() },
  { id: 'item_suit_2pc', name: 'Suit 2-Piece', parentId: 'cat_mens', type: 'item', price: 15.00, sortOrder: 2, created_at: new Date().toISOString() },
  { id: 'item_womens_dress_plain', name: 'Dress - Plain', parentId: 'cat_womens', type: 'item', price: 12.00, sortOrder: 0, created_at: new Date().toISOString() },
  { id: 'cat_laundry', name: 'Laundry', parentId: null, type: 'category', sortOrder: 1, created_at: new Date().toISOString() },
  { id: 'item_laundry_shirt_hanger', name: "Men's Shirt - Hanger", parentId: 'cat_laundry', type: 'item', price: 3.50, sortOrder: 0, created_at: new Date().toISOString() },
];


if (!global.mockServicesStore) {
  global.mockServicesStore = [...initialServices];
}
if (!global.mockOrdersStore) {
  global.mockOrdersStore = [...initialOrders];
}
if (!global.mockInventoryStore) {
  global.mockInventoryStore = [...initialInventory];
}

// Helper to ensure catalog store is initialized and accessible
const getSafeCatalogStore = (): CatalogEntry[] => {
  if (!global.mockCatalogEntriesStore) {
    global.mockCatalogEntriesStore = [...initialCatalogEntries];
  }
  return global.mockCatalogEntriesStore;
};


// Customer Data Functions (using Supabase)
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers from Supabase:', error);
    throw error;
  }
  return (data as Customer[]) || [];
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "single row not found"
    console.error('Error fetching customer by ID from Supabase:', error);
    throw error;
  }
  return data as Customer | undefined;
}

export async function createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
  // Map from CreateCustomerInput (camelCase) to database schema (snake_case)
  const customerToInsert = {
    name: customerData.name,
    phone: customerData.phone || null,
    email: customerData.email || null,
    address: customerData.address || null,
    loyalty_status: customerData.loyaltyStatus || 'None',
    price_band: customerData.priceBand || 'Standard',
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(customerToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error adding customer to Supabase:', error);
    throw error;
  }
  return data as Customer;
}

// Mock Data Functions (for services, orders, inventory - to be migrated later)
export const getMockServices = (): ServiceItem[] => global.mockServicesStore!;
export const getMockOrders = (): Order[] => {
  return global.mockOrdersStore!.map(order => ({
      ...order,
      created_at: typeof order.created_at === 'string' ? order.created_at : new Date(order.created_at).toISOString(),
      updated_at: typeof order.updated_at === 'string' ? order.updated_at : new Date(order.updated_at).toISOString(),
      dueDate: order.dueDate ? (typeof order.dueDate === 'string' ? order.dueDate : new Date(order.dueDate).toISOString()) : undefined,
  }));
};
export const getMockInventory = (): InventoryItem[] => global.mockInventoryStore!;


export function getOrderById(id: string): Order | undefined {
  const orders = getMockOrders();
  const order = orders.find(o => o.id === id);
  if (order && !order.paymentStatus) {
    order.paymentStatus = 'Unpaid';
  }
  return order;
}

export function getServiceById(id:string): ServiceItem | undefined {
  return global.mockServicesStore!.find(s => s.id === id);
}

export function getInventoryItemById(id: string): InventoryItem | undefined {
  return global.mockInventoryStore!.find(i => i.id === id);
}

// Catalog Entry Mock Functions
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50)); // Reduced timeout
  const store = getSafeCatalogStore();
  return [...store]; // Return a copy
}

export async function addCatalogEntry(entry: Omit<CatalogEntry, 'id' | 'created_at' | 'updated_at' | 'sortOrder'> & { parentId: string | null }): Promise<CatalogEntry> {
  const store = getSafeCatalogStore();
  const safeName = String(entry.name || 'unnamed_entry'); // Ensure name is a string for ID generation
  const newId = `${entry.type}_${safeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_${Date.now()}`;
  
  const siblings = store.filter(e => e.parentId === entry.parentId);
  const newEntry: CatalogEntry = {
    ...entry,
    name: safeName, // Use the sanitized name
    id: newId,
    sortOrder: siblings.length, // Simple sort order for now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.push(newEntry);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50)); // Reduced timeout
  return newEntry;
}

export function buildCatalogHierarchy(entries: CatalogEntry[], parentId: string | null = null): CatalogHierarchyNode[] {
  if (!entries) return []; // Guard against undefined entries array
  return entries
    .filter(entry => entry.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(entry => ({
      ...entry,
      children: buildCatalogHierarchy(entries, entry.id),
    }));
}

export async function getFullCatalogHierarchy(): Promise<CatalogHierarchyNode[]> {
  const allEntries = await getCatalogEntries();
  return buildCatalogHierarchy(allEntries);
}

    