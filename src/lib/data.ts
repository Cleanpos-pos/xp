
import type { Order, Customer, ServiceItem, InventoryItem, OrderStatus, PaymentStatus, CatalogEntry, CatalogHierarchyNode, CatalogEntryType } from '@/types';
import type { CreateCustomerInput } from '@/app/(app)/customers/new/customer.schema';
import { supabase } from './supabase';
import { format } from 'date-fns';


// Define types for our global stores for mock data (non-customer, non-staff, non-catalog)
declare global {
  // eslint-disable-next-line no-var
  var mockOrdersStore: Order[] | undefined;
  // eslint-disable-next-line no-var
  // var mockInventoryStore: InventoryItem[] | undefined; // To be removed
}

const generateOrderNumber = (index: number, date: Date = new Date()): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
  const baseId = String(1000 + index).padStart(6, '0');
  return `${month}-XP-${baseId}`;
};

// Create dates for different months for mock data
const dateOneMonthAgo = new Date();
dateOneMonthAgo.setMonth(dateOneMonthAgo.getMonth() - 1);
const dateTwoMonthsAgo = new Date();
dateTwoMonthsAgo.setMonth(dateTwoMonthsAgo.getMonth() - 2);

const initialOrders: Order[] = [
  {
    id: 'order1',
    orderNumber: generateOrderNumber(1, new Date()), // Current month
    customerId: 'cust1',
    customerName: 'John Doe',
    items: [
      { id: 'item1', serviceItemId: 'serv1', serviceName: "Men's Shirt - Hanger", quantity: 5, unitPrice: 3.50, totalPrice: 17.50, has_color_identifier: false },
      { id: 'item2', serviceItemId: 'serv2', serviceName: 'Suit 2-Piece', quantity: 1, unitPrice: 15.00, totalPrice: 15.00, has_color_identifier: false },
    ],
    totalAmount: 32.50,
    status: 'Ready for Pickup' as OrderStatus,
    paymentStatus: 'Paid' as PaymentStatus,
    created_at: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    updated_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
    isExpress: true, // Example of an express order
  },
  {
    id: 'order2',
    orderNumber: generateOrderNumber(2, dateOneMonthAgo), // Last month
    customerId: 'cust2',
    customerName: 'Jane Smith',
    items: [
      { id: 'item3', serviceItemId: 'serv3', serviceName: 'Dress - Silk', quantity: 1, unitPrice: 18.00, totalPrice: 18.00, has_color_identifier: true, color_value: "Red" },
    ],
    totalAmount: 18.00,
    status: 'Cleaning' as OrderStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    created_at: new Date(dateOneMonthAgo.setDate(dateOneMonthAgo.getDate() - 5)).toISOString(),
    updated_at: new Date(dateOneMonthAgo.setDate(dateOneMonthAgo.getDate() - 2)).toISOString(),
    dueDate: new Date(dateOneMonthAgo.setDate(dateOneMonthAgo.getDate() + 1)).toISOString(),
    isExpress: false,
  },
  {
    id: 'order3',
    orderNumber: generateOrderNumber(3, dateTwoMonthsAgo), // Two months ago
    customerId: 'cust1', // Another order for John Doe
    customerName: 'John Doe',
    items: [
      { id: 'item4', serviceItemId: 'serv4', serviceName: 'Trousers - Cotton', quantity: 2, unitPrice: 7.00, totalPrice: 14.00, has_color_identifier: true, color_value: "Khaki" },
    ],
    totalAmount: 14.00,
    status: 'Received' as OrderStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    created_at: new Date(dateTwoMonthsAgo.setDate(dateTwoMonthsAgo.getDate() - 1)).toISOString(),
    updated_at: new Date(dateTwoMonthsAgo.setDate(dateTwoMonthsAgo.getDate() - 0)).toISOString(),
    dueDate: new Date(dateTwoMonthsAgo.setDate(dateTwoMonthsAgo.getDate() + 4)).toISOString(),
  },
];


if (!global.mockOrdersStore) {
  global.mockOrdersStore = [...initialOrders];
}

// Customer Data Functions (using Supabase)
export async function getCustomers(): Promise<Customer[]> {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[getCustomers] Current Supabase auth session:', session ? `User: ${session.user.id}` : 'No session');

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers from Supabase:', error);
    throw error;
  }
  return ((data || []) as Customer[]).map(c => ({
    ...c,
    created_at: c.created_at ? new Date(c.created_at).toISOString() : null,
    updated_at: c.updated_at ? new Date(c.updated_at).toISOString() : null,
    account_id: c.account_id === null ? undefined : c.account_id, // Ensure null from DB becomes undefined for form
    sms_opt_in: c.sms_opt_in ?? false,
    email_opt_in: c.email_opt_in ?? false,
    has_preferred_pricing: c.has_preferred_pricing ?? false,
    is_account_client: c.is_account_client ?? false,
  }));
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  if (typeof id !== 'string') {
    console.error(`[getCustomerById] Received non-string ID: ${id} (type: ${typeof id}). Aborting fetch.`);
    return undefined;
  }
  const trimmedId = id.trim(); 
  console.log(`[getCustomerById] Attempting to fetch customer by ID from Supabase. Trimmed ID: '${trimmedId}' (length ${trimmedId.length})`);

  const { data: { session } } = await supabase.auth.getSession();
  console.log('[getCustomerById] Current Supabase auth session:', session ? `User: ${session.user.id}` : 'No session');

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', trimmedId) 
    .single();

  if (error) {
    if (error.code === 'PGRST116') { 
      console.warn(`[getCustomerById] Customer with ID '${trimmedId}' not found in Supabase (PGRST116).`);
      return undefined;
    }
    console.error(`[getCustomerById] Error fetching customer by ID '${trimmedId}' from Supabase:`, error);
    throw error;
  }

  if (!data) {
    console.warn(`[getCustomerById] Customer with ID '${trimmedId}' not found in Supabase (no data returned, but no explicit 'PGRST116' error).`);
    return undefined;
  }

  console.log(`[getCustomerById] Successfully fetched customer from Supabase: Name: ${data.name}, ID: ${data.id}`);
  return {
    ...data,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
    updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : null,
    account_id: data.account_id === null ? undefined : data.account_id,
    sms_opt_in: data.sms_opt_in ?? false,
    email_opt_in: data.email_opt_in ?? false,
    has_preferred_pricing: data.has_preferred_pricing ?? false,
    is_account_client: data.is_account_client ?? false,
  } as Customer;
}

export async function createCustomer(customerData: CreateCustomerInput): Promise<Customer> {
  const customerToInsert = {
    name: customerData.name,
    phone: customerData.phone || null,
    email: customerData.email || null,
    address: customerData.address || null,
    loyalty_status: customerData.loyaltyStatus || 'None',
    price_band: customerData.priceBand || 'Standard',
    is_account_client: customerData.isAccountClient || false,
    account_id: customerData.accountId || null,
    sms_opt_in: customerData.smsOptIn || false,
    email_opt_in: customerData.emailOptIn || false,
    has_preferred_pricing: customerData.hasPreferredPricing || false,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(customerToInsert)
    .select('*')
    .single();

  if (error) {
    console.error('Error adding customer to Supabase:', error);
    throw error;
  }
  return {
    ...data,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
    updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : null,
    account_id: data.account_id === null ? undefined : data.account_id,
    sms_opt_in: data.sms_opt_in ?? false,
    email_opt_in: data.email_opt_in ?? false,
    has_preferred_pricing: data.has_preferred_pricing ?? false,
    is_account_client: data.is_account_client ?? false,
  } as Customer;
}

export async function updateCustomerAccountDetailsDb(
  customerId: string,
  details: { is_account_client?: boolean; account_id?: string | null }
): Promise<Customer> {
  const updateData: Partial<Customer> = {};
  if (details.is_account_client !== undefined) {
    updateData.is_account_client = details.is_account_client;
  }
  if (details.account_id !== undefined) {
    updateData.account_id = details.account_id === "" ? null : details.account_id;
  }

  if (Object.keys(updateData).length === 0) {
    const currentCustomer = await getCustomerById(customerId);
    if (!currentCustomer) throw new Error("Customer not found for update and no details provided.");
    return currentCustomer;
  }
  
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', customerId)
    .select('*')
    .single();

  if (error) {
    console.error(`Error updating customer account details for ID ${customerId} in Supabase:`, error);
    throw error;
  }
  if (!data) {
    throw new Error(`Customer with ID ${customerId} not found or update failed.`);
  }
  return {
    ...data,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
    updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : null,
    account_id: data.account_id === null ? undefined : data.account_id,
    sms_opt_in: data.sms_opt_in ?? false,
    email_opt_in: data.email_opt_in ?? false,
    has_preferred_pricing: data.has_preferred_pricing ?? false,
    is_account_client: data.is_account_client ?? false,
  } as Customer;
}

export async function updateFullCustomerDb(customerId: string, customerData: CreateCustomerInput): Promise<Customer> {
  const dataToUpdate = {
    name: customerData.name,
    phone: customerData.phone || null,
    email: customerData.email || null,
    address: customerData.address || null,
    loyalty_status: customerData.loyaltyStatus || 'None',
    price_band: customerData.priceBand || 'Standard',
    sms_opt_in: customerData.smsOptIn || false,
    email_opt_in: customerData.emailOptIn || false,
    has_preferred_pricing: customerData.hasPreferredPricing || false,
    is_account_client: customerData.isAccountClient || false,
    account_id: customerData.isAccountClient ? (customerData.accountId || null) : null, 
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('customers')
    .update(dataToUpdate)
    .eq('id', customerId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating full customer details in Supabase:', error);
    throw error;
  }
  if (!data) {
    throw new Error(`Customer with ID ${customerId} not found or update failed.`);
  }
  return {
    ...data,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : null,
    updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : null,
    account_id: data.account_id === null ? undefined : data.account_id,
    sms_opt_in: data.sms_opt_in ?? false,
    email_opt_in: data.email_opt_in ?? false,
    has_preferred_pricing: data.has_preferred_pricing ?? false,
    is_account_client: data.is_account_client ?? false,
  } as Customer;
}


// Mock Order Data Functions (to be migrated later)

export const getMockOrders = (): Order[] => {
  return global.mockOrdersStore!.map(order => ({
      ...order,
      created_at: typeof order.created_at === 'string' ? order.created_at : new Date(order.created_at).toISOString(),
      updated_at: typeof order.updated_at === 'string' ? order.updated_at : new Date(order.updated_at).toISOString(),
      dueDate: order.dueDate ? (typeof order.dueDate === 'string' ? order.dueDate : new Date(order.dueDate).toISOString()) : undefined,
  }));
};

export function getOrderById(id: string): Order | undefined {
  const orders = getMockOrders();
  const order = orders.find(o => o.id === id);
  if (order && !order.paymentStatus) {
    order.paymentStatus = 'Unpaid';
  }
  if (order && typeof order.isExpress === 'undefined') {
    order.isExpress = false;
  }
  return order;
}

export function getOrdersByCustomerIdLocal(customerId: string): Order[] {
  if (!customerId) return [];
  return getMockOrders().filter(order => order.customerId === customerId);
}

export function searchOrdersLocal(searchTerm: string): Order[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  return getMockOrders().filter(order => {
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.customerId.toLowerCase().includes(term)
    );
  });
}


// Inventory Data Functions (using Supabase)
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching inventory items from Supabase:', error);
    throw error;
  }
  return ((data || []) as InventoryItem[]).map(item => ({
    ...item,
    last_restocked_at: item.last_restocked_at ? new Date(item.last_restocked_at).toISOString() : null,
    created_at: new Date(item.created_at).toISOString(),
    updated_at: new Date(item.updated_at).toISOString(),
  }));
}

export async function createInventoryItemDb(itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
  // last_restocked_at is optional and can be null/undefined
  const itemToInsert = {
    ...itemData,
    low_stock_threshold: itemData.low_stock_threshold ?? 0, // Default if undefined
  };

  const { data, error } = await supabase
    .from('inventory_items')
    .insert(itemToInsert)
    .select('*')
    .single();

  if (error) {
    console.error('Error adding inventory item to Supabase:', error);
    throw error;
  }
  return {
    ...data,
    last_restocked_at: data.last_restocked_at ? new Date(data.last_restocked_at).toISOString() : null,
    created_at: new Date(data.created_at).toISOString(),
    updated_at: new Date(data.updated_at).toISOString(),
  } as InventoryItem;
}

// Placeholder for getInventoryItemById - to be implemented if needed for edit functionality
export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
   const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return undefined;
    }
    console.error(`Error fetching inventory item by ID ${id}:`, error);
    throw error;
  }
  if (!data) return undefined;

  return {
    ...data,
    last_restocked_at: data.last_restocked_at ? new Date(data.last_restocked_at).toISOString() : null,
    created_at: new Date(data.created_at).toISOString(),
    updated_at: new Date(data.updated_at).toISOString(),
  } as InventoryItem;
}


// Catalog Entry Functions (using Supabase)
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  const { data, error } = await supabase
    .from('catalog_entries')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching catalog entries from Supabase:', error);
    throw error;
  }
  return (data || []).map(entry => ({
    ...entry,
    price: entry.price !== null && entry.price !== undefined ? parseFloat(entry.price) : undefined,
    has_color_identifier: entry.has_color_identifier ?? false,
    created_at: entry.created_at ? new Date(entry.created_at).toISOString() : undefined,
    updated_at: entry.updated_at ? new Date(entry.updated_at).toISOString() : undefined,
  })) as CatalogEntry[];
}

export async function addCatalogEntry(entry: Omit<CatalogEntry, 'id' | 'created_at' | 'updated_at' | 'sort_order'>): Promise<CatalogEntry> {
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
    console.error('[addCatalogEntry] Supabase error counting siblings for sort_order:', countResult.error);
    throw countResult.error;
  }

  const sort_order = countResult.count || 0;

  const entryToInsert: any = {
    name: entry.name,
    parent_id: entry.parent_id,
    type: entry.type,
    description: entry.description,
    sort_order: sort_order,
  };

  if (entry.type === 'item') {
    entryToInsert.has_color_identifier = entry.has_color_identifier; // Should be boolean (true/false) from action
    entryToInsert.price = entry.price ?? 0;
  }
  // If type is 'category', has_color_identifier is NOT added to entryToInsert
  // (because entry.has_color_identifier was undefined from action), relying on DB default.

  console.log("[addCatalogEntry] Object being inserted into Supabase:", JSON.stringify(entryToInsert, null, 2));

  const { data, error } = await supabase
    .from('catalog_entries')
    .insert(entryToInsert) 
    .select('*') 
    .single();

  if (error) {
    console.error('[addCatalogEntry] Supabase error adding catalog entry:', JSON.stringify(error, null, 2));
    throw error;
  }

  if (!data) {
    const errorMessage = '[addCatalogEntry] Failed to add catalog entry: Supabase returned no data after insert. This may be due to RLS policies or other database constraints.';
    console.error(errorMessage, 'Entry data attempted:', JSON.stringify(entryToInsert, null, 2));
    throw new Error(errorMessage);
  }
  
  console.log("[addCatalogEntry] Successfully inserted catalog entry, Supabase returned:", JSON.stringify(data, null, 2));
  return {
    ...data,
    price: data.price !== null && data.price !== undefined ? parseFloat(data.price) : undefined,
    has_color_identifier: data.has_color_identifier ?? false,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : undefined,
    updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  } as CatalogEntry;
}

export async function updateCatalogEntry(
  entryId: string,
  dataToUpdate: Partial<Pick<CatalogEntry, 'name' | 'price' | 'description' | 'has_color_identifier'>>
): Promise<CatalogEntry> {
  const updatePayload: { [key: string]: any } = { ...dataToUpdate };

  const { data: currentEntry, error: fetchError } = await supabase
      .from('catalog_entries')
      .select('type, price, has_color_identifier')
      .eq('id', entryId)
      .single();

  if (fetchError || !currentEntry) {
    console.error(`Error fetching entry ${entryId} before update or entry not found:`, fetchError);
    throw new Error(`Failed to fetch entry details for update: ${entryId}`);
  }

  if (currentEntry.type === 'item') {
    if (dataToUpdate.price === undefined) {
       delete updatePayload.price; // Don't update price if not provided
    } else {
      updatePayload.price = dataToUpdate.price;
    }
    if (dataToUpdate.has_color_identifier === undefined) {
      delete updatePayload.has_color_identifier; // Don't update if not provided
    } else {
      updatePayload.has_color_identifier = dataToUpdate.has_color_identifier;
    }
  } else { // Category
     updatePayload.price = null;
     delete updatePayload.has_color_identifier; // Categories don't have this
  }


  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('catalog_entries')
    .update(updatePayload)
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) {
    console.error(`Error updating catalog entry ${entryId} in Supabase:`, error);
    throw error;
  }
  if (!data) {
    throw new Error(`Catalog entry with ID ${entryId} not found or update failed.`);
  }
  return {
    ...data,
    price: data.price !== null && data.price !== undefined ? parseFloat(data.price) : undefined,
    has_color_identifier: data.has_color_identifier ?? false,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : undefined,
    updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : undefined,
  } as CatalogEntry;
}

export async function deleteCatalogEntry(entryId: string): Promise<{ success: boolean, message?: string }> {
  const { data: children, error: childrenError } = await supabase
    .from('catalog_entries')
    .select('id')
    .eq('parent_id', entryId);

  if (childrenError) {
    console.error(`Error checking children for catalog entry ${entryId}:`, childrenError);
    return { success: false, message: `Error checking children: ${childrenError.message}` };
  }

  if (children && children.length > 0) {
    return { success: false, message: "Cannot delete category: It contains sub-categories or items. Please empty the category first." };
  }

  const { error: deleteError, count } = await supabase
    .from('catalog_entries')
    .delete()
    .eq('id', entryId);

  if (deleteError) {
    console.error(`Error deleting catalog entry ${entryId} from Supabase:`, deleteError);
    return { success: false, message: `Error deleting entry: ${deleteError.message}` };
  }

  if (count === 0) {
    return { success: false, message: "Entry not found or already deleted." };
  }

  return { success: true, message: "Entry deleted successfully." };
}


export function buildCatalogHierarchy(entries: CatalogEntry[], parent_id: string | null = null): CatalogHierarchyNode[] {
  if (!entries) return [];
  return entries
    .filter(entry => entry.parent_id === parent_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(entry => ({
      ...entry,
      children: buildCatalogHierarchy(entries, entry.id),
    }));
}

export async function getFullCatalogHierarchy(): Promise<CatalogHierarchyNode[]> {
  const allEntries = await getCatalogEntries();
  return buildCatalogHierarchy(allEntries);
}

// Service Item related functions (now from catalog)
async function getServiceItemsFromCatalog(): Promise<ServiceItem[]> {
  const allEntries = await getCatalogEntries();
  
  const categoryMap = new Map<string, string>();
  allEntries.forEach(entry => {
    if (entry.type === 'category') {
      categoryMap.set(entry.id, entry.name);
    }
  });

  return allEntries
    .filter(entry => entry.type === 'item' && entry.price !== undefined)
    .map(item => ({
      id: item.id,
      name: item.name,
      price: item.price!, 
      description: item.description || undefined,
      category: item.parent_id ? (categoryMap.get(item.parent_id) || 'General Services') : 'General Services',
      has_color_identifier: item.has_color_identifier ?? false,
    }));
}

export async function getMockServices(): Promise<ServiceItem[]> {
  return getServiceItemsFromCatalog();
}


export function getServiceById(id:string): ServiceItem | undefined {
  console.warn("getServiceById is using a non-performant mock lookup. Refactor if used broadly.");
  return undefined; 
}

export { generateOrderNumber };

