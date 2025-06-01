
import type { Order, Customer, ServiceItem, InventoryItem, OrderStatus, PaymentStatus } from '@/types';
import type { CreateCustomerInput } from '@/app/(app)/customers/new/customer.schema';

const commonDate = new Date();

export const mockCustomers: Customer[] = [
  { id: 'cust1', name: 'John Doe', phone: '555-1234', email: 'john.doe@example.com', createdAt: new Date(commonDate.setDate(commonDate.getDate() - 10)) },
  { id: 'cust2', name: 'Jane Smith', phone: '555-5678', email: 'jane.smith@example.com', createdAt: new Date(commonDate.setDate(commonDate.getDate() - 5)) },
  { id: 'cust3', name: 'Alice Brown', phone: '555-8765', createdAt: new Date(commonDate.setDate(commonDate.getDate() - 20)) },
];

export const mockServices: ServiceItem[] = [
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

export const mockOrders: Order[] = [
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
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
  },
  {
    id: 'order2',
    orderNumber: generateOrderNumber(2),
    customerId: 'cust2',
    customerName: 'Jane Smith',
    items: [
      { id: 'item3', serviceItemId: 'serv3', serviceName: 'Dress - Plain', quantity: 2, unitPrice: 12.00, totalPrice: 24.00, notes: 'Delicate fabric' },
    ],
    totalAmount: 24.00,
    status: 'Cleaning' as OrderStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
  },
  {
    id: 'order3',
    orderNumber: generateOrderNumber(3),
    customerId: 'cust1',
    customerName: 'John Doe',
    items: [
      { id: 'item4', serviceItemId: 'serv4', serviceName: 'Pants Hemming', quantity: 1, unitPrice: 10.00, totalPrice: 10.00 },
    ],
    totalAmount: 10.00,
    status: 'Completed' as OrderStatus,
    paymentStatus: 'Paid' as PaymentStatus,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 7)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
   {
    id: 'order4',
    orderNumber: generateOrderNumber(4),
    customerId: 'cust3',
    customerName: 'Alice Brown',
    items: [
      { id: 'item5', serviceItemId: 'serv5', serviceName: 'Comforter - Queen', quantity: 1, unitPrice: 25.00, totalPrice: 25.00 },
    ],
    totalAmount: 25.00,
    status: 'Received' as OrderStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 4)),
  },
];

export const mockInventory: InventoryItem[] = [
  { id: 'inv1', name: 'Dry Cleaning Solvent', quantity: 50, unit: 'liters', lowStockThreshold: 20 },
  { id: 'inv2', name: 'Hangers - Wire', quantity: 850, unit: 'pieces', lowStockThreshold: 200 },
  { id: 'inv3', name: 'Garment Bags - Clear', quantity: 400, unit: 'pieces', lowStockThreshold: 100 },
  { id: 'inv4', name: 'Laundry Detergent', quantity: 25, unit: 'kg', lowStockThreshold: 5 },
];

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find(c => c.id === id);
}

export function addMockCustomer(customerData: CreateCustomerInput): Customer {
  const newCustomerId = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newCustomer: Customer = {
    id: newCustomerId,
    name: customerData.name,
    phone: customerData.phone,
    email: customerData.email,
    address: customerData.address,
    createdAt: new Date(),
  };
  mockCustomers.push(newCustomer);
  console.log("Added new customer to mock store:", newCustomer);
  console.log("Current mockCustomers:", mockCustomers);
  return newCustomer;
}

export function getOrderById(id: string): Order | undefined {
  const order = mockOrders.find(o => o.id === id);
  if (order && !order.paymentStatus) {
    order.paymentStatus = 'Unpaid';
  }
  return order;
}

export function getServiceById(id:string): ServiceItem | undefined {
  return mockServices.find(s => s.id === id);
}

export function getInventoryItemById(id: string): InventoryItem | undefined {
  return mockInventory.find(i => i.id === id);
}
