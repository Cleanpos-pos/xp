
import type { Order, Customer, ServiceItem, InventoryItem, OrderStatus, PaymentStatus, CatalogEntry, CatalogHierarchyNode, CatalogEntryType } from '@/types';
import type { CreateCustomerInput } from '@/app/(app)/customers/new/customer.schema';
import { supabase } from './supabase';


// Define types for our global stores for mock data (non-customer, non-staff, non-catalog)
declare global {
  // eslint-disable-next-line no-var
  var mockServicesStore: ServiceItem[] | undefined;
  // eslint-disable-next-line no-var
  var mockOrdersStore: Order[] | undefined;
  // eslint-disable-next-line no-var
  var mockInventoryStore: InventoryItem[] | undefined;
  // var mockCatalogEntriesStore: CatalogEntry[] | undefined; // Removed, will use Supabase
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


if (!global.mockServicesStore) {
  global.mockServicesStore = [...initialServices];
}
if (!global.mockOrdersStore) {
  global.mockOrdersStore = [...initialOrders];
}
if (!global.mockInventoryStore) {
  global.mockInventoryStore = [...initialInventory];
}

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

// Catalog Entry Functions (using Supabase)
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  const { data, error } = await supabase
    .from('catalog_entries')
    .select('*')
    .order('sort_order', { ascending: true }); // Order by sort_order

  if (error) {
    console.error('Error fetching catalog entries from Supabase:', error);
    throw error;
  }
  // Ensure price is number or undefined, not string from numeric db type
  return (data || []).map(entry => ({
    ...entry,
    price: entry.price !== null ? parseFloat(entry.price) : undefined,
  })) as CatalogEntry[];
}

export async function addCatalogEntry(entry: Omit<CatalogEntry, 'id' | 'created_at' | 'updated_at' | 'sort_order'>): Promise<CatalogEntry> {
  // Calculate sort_order: count existing siblings
  let countResult;
  if (entry.parent_id) {
    countResult = await supabase
      .from('catalog_entries')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', entry.parent_id);
  } else {
    countResult = await supabase
      .from('catalog_entries')
      .select('id', { count: 'exact', head: true })
      .is('parent_id', null);
  }

  if (countResult.error) {
    console.error('Error counting siblings for sort_order:', countResult.error);
    throw countResult.error;
  }

  const sort_order = countResult.count || 0;

  const entryToInsert = {
    name: entry.name,
    parent_id: entry.parent_id,
    type: entry.type,
    price: entry.type === 'item' ? entry.price : null, // Ensure price is null for categories
    description: entry.description,
    sort_order: sort_order,
  };

  const { data, error } = await supabase
    .from('catalog_entries')
    .insert(entryToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error adding catalog entry to Supabase:', error);
    throw error;
  }
  // Ensure price is number or undefined after insert
  return { ...data, price: data.price !== null ? parseFloat(data.price) : undefined } as CatalogEntry;
}


export function buildCatalogHierarchy(entries: CatalogEntry[], parent_id: string | null = null): CatalogHierarchyNode[] {
  if (!entries) return [];
  return entries
    .filter(entry => entry.parent_id === parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(entry => ({
      ...entry,
      children: buildCatalogHierarchy(entries, entry.id),
    }));
}

export async function getFullCatalogHierarchy(): Promise<CatalogHierarchyNode[]> {
  const allEntries = await getCatalogEntries();
  return buildCatalogHierarchy(allEntries);
}
