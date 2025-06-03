
import type { Order, OrderItem as AppOrderItemType, Customer, ServiceItem, InventoryItem, OrderStatus, PaymentStatus, CatalogEntry, CatalogHierarchyNode, CatalogEntryType } from '@/types';
import type { CreateCustomerInput } from '@/app/(app)/customers/new/customer.schema';
import { supabase } from './supabase';
import { format } from 'date-fns';
import type { CreateOrderInput, OrderItemInput } from '@/app/(app)/orders/new/order.schema';


// Define types for our global stores for mock data (non-customer, non-staff, non-catalog)
// global.mockOrdersStore has been removed as orders are now in Supabase.

const generateOrderNumber = (date: Date = new Date()): string => {
  // Generates a unique order number. For Supabase, this could be a DB sequence or a more robust generation.
  // For now, using a timestamp-based approach for local generation before DB insert.
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${month}${day}-XP-${randomSuffix}`;
};


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

// Order Data Functions (Now using Supabase)
export async function createOrderDb(orderInput: CreateOrderInput): Promise<Order> {
  const customer = await getCustomerById(orderInput.customerId);
  if (!customer) {
    throw new Error(`Customer with ID ${orderInput.customerId} not found.`);
  }

  // Calculate totals (this logic should mirror the frontend for consistency but ultimately be server-authoritative)
  let subtotal = 0;
  orderInput.items.forEach(item => {
    let itemPrice = item.unitPrice * item.quantity;
    if (item.itemDiscountPercentage && item.itemDiscountPercentage > 0) {
      itemPrice -= itemPrice * (item.itemDiscountPercentage / 100);
    }
    if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
      itemPrice -= item.itemDiscountAmount;
    }
    subtotal += Math.max(0, itemPrice);
  });

  let totalAfterCartDiscounts = subtotal;
  if (orderInput.cartDiscountPercentage && orderInput.cartDiscountPercentage > 0) {
    totalAfterCartDiscounts -= totalAfterCartDiscounts * (orderInput.cartDiscountPercentage / 100);
  }
  if (orderInput.cartDiscountAmount && orderInput.cartDiscountAmount > 0) {
    totalAfterCartDiscounts -= orderInput.cartDiscountAmount;
  }
  totalAfterCartDiscounts = Math.max(0, totalAfterCartDiscounts);

  const grandTotal = (orderInput.cartPriceOverride !== undefined && orderInput.cartPriceOverride >= 0)
    ? orderInput.cartPriceOverride
    : totalAfterCartDiscounts;

  const orderToInsert = {
    order_number: generateOrderNumber(), // Generate a new order number
    customer_id: orderInput.customerId,
    customer_name: customer.name, // Denormalized
    subtotal_amount: subtotal,
    cart_discount_amount: orderInput.cartDiscountAmount,
    cart_discount_percentage: orderInput.cartDiscountPercentage,
    cart_price_override: orderInput.cartPriceOverride,
    total_amount: grandTotal,
    status: 'Received' as OrderStatus, // Default status
    payment_status: 'Unpaid' as PaymentStatus, // Default payment status
    notes: orderInput.notes,
    is_express: orderInput.isExpress || false,
    due_date: orderInput.dueDate ? new Date(orderInput.dueDate).toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: newOrderData, error: orderError } = await supabase
    .from('orders')
    .insert(orderToInsert)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order in Supabase:', orderError);
    throw orderError;
  }
  if (!newOrderData) {
    throw new Error('Failed to create order: No data returned from Supabase.');
  }

  const orderItemsToInsert = orderInput.items.map(item => {
    let itemEffectiveTotal = item.unitPrice * item.quantity;
    if (item.itemDiscountPercentage && item.itemDiscountPercentage > 0) {
      itemEffectiveTotal -= itemEffectiveTotal * (item.itemDiscountPercentage / 100);
    }
    if (item.itemDiscountAmount && item.itemDiscountAmount > 0) {
      itemEffectiveTotal -= item.itemDiscountAmount;
    }
    itemEffectiveTotal = Math.max(0, itemEffectiveTotal);

    return {
      order_id: newOrderData.id,
      service_item_id: item.serviceItemId,
      service_name: item.serviceName, // Denormalized
      quantity: item.quantity,
      unit_price: item.unitPrice,
      original_unit_price: item.originalUnitPrice,
      item_discount_amount: item.itemDiscountAmount,
      item_discount_percentage: item.itemDiscountPercentage,
      total_price: itemEffectiveTotal,
      notes: item.notes,
      has_color_identifier: item.has_color_identifier,
      color_value: item.color_value,
    };
  });

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsToInsert);

  if (itemsError) {
    console.error('Error creating order items in Supabase:', itemsError);
    // Potentially delete the created order if items fail to insert (transactional behavior needed for production)
    await supabase.from('orders').delete().eq('id', newOrderData.id);
    throw itemsError;
  }

  // Fetch the full order with items to return
  return getOrderByIdDb(newOrderData.id).then(order => {
    if (!order) throw new Error("Failed to retrieve newly created order.");
    return order;
  });
}

export async function getAllOrdersDb(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all orders from Supabase:', error);
    throw error;
  }
  return (data || []).map(mapSupabaseOrderToAppOrder);
}

export async function getOrderByIdDb(id: string): Promise<Order | undefined> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined; // Not found
    console.error(`Error fetching order by ID ${id} from Supabase:`, error);
    throw error;
  }
  return data ? mapSupabaseOrderToAppOrder(data) : undefined;
}

export async function getOrdersByCustomerIdDb(customerId: string): Promise<Order[]> {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching orders for customer ID ${customerId} from Supabase:`, error);
    throw error;
  }
  return (data || []).map(mapSupabaseOrderToAppOrder);
}

export async function searchOrdersDb(searchTerm: string): Promise<Order[]> {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  // Basic search: order_number or customer_name.
  // For more advanced search, consider Supabase full-text search or more specific queries.
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *
      )
    `)
    .or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%`)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(`Error searching orders with term "${term}" from Supabase:`, error);
    throw error;
  }
  return (data || []).map(mapSupabaseOrderToAppOrder);
}

// Helper to map Supabase order structure to application's Order type
function mapSupabaseOrderToAppOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    customerId: dbOrder.customer_id,
    customerName: dbOrder.customer_name,
    items: (dbOrder.order_items || []).map((item: any): AppOrderItemType => ({
      id: item.id,
      serviceItemId: item.service_item_id,
      serviceName: item.service_name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      originalUnitPrice: item.original_unit_price ? parseFloat(item.original_unit_price) : undefined,
      itemDiscountAmount: item.item_discount_amount ? parseFloat(item.item_discount_amount) : undefined,
      itemDiscountPercentage: item.item_discount_percentage ? parseFloat(item.item_discount_percentage) : undefined,
      totalPrice: parseFloat(item.total_price),
      notes: item.notes,
      has_color_identifier: item.has_color_identifier,
      color_value: item.color_value,
    })),
    subtotalAmount: dbOrder.subtotal_amount ? parseFloat(dbOrder.subtotal_amount) : undefined,
    cartDiscountAmount: dbOrder.cart_discount_amount ? parseFloat(dbOrder.cart_discount_amount) : undefined,
    cartDiscountPercentage: dbOrder.cart_discount_percentage ? parseFloat(dbOrder.cart_discount_percentage) : undefined,
    cartPriceOverride: dbOrder.cart_price_override ? parseFloat(dbOrder.cart_price_override) : undefined,
    totalAmount: parseFloat(dbOrder.total_amount),
    status: dbOrder.status as OrderStatus,
    paymentStatus: dbOrder.payment_status as PaymentStatus,
    created_at: new Date(dbOrder.created_at).toISOString(),
    updated_at: new Date(dbOrder.updated_at).toISOString(),
    dueDate: dbOrder.due_date ? new Date(dbOrder.due_date).toISOString() : undefined,
    notes: dbOrder.notes,
    isExpress: dbOrder.is_express,
  };
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
    entryToInsert.has_color_identifier = (typeof entry.has_color_identifier === 'boolean')
      ? entry.has_color_identifier
      : false; 
    entryToInsert.price = entry.price ?? 0;
  }
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
       delete updatePayload.price;
    } else {
      updatePayload.price = dataToUpdate.price;
    }
    updatePayload.has_color_identifier = dataToUpdate.has_color_identifier ?? false;
  } else { 
     updatePayload.price = null; 
     delete updatePayload.has_color_identifier; 
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

export async function getServices(): Promise<ServiceItem[]> { // Renamed from getMockServices
  return getServiceItemsFromCatalog();
}


export function getServiceById(id:string): ServiceItem | undefined {
  console.warn("getServiceById is using a non-performant mock lookup. Refactor if used broadly.");
  // This would need to fetch from catalog_entries and map to ServiceItem
  return undefined; 
}

export { generateOrderNumber };

    