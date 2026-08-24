export type UserRole = 'customer' | 'admin' | 'kitchen';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface FoodItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: Category | string;
  image?: string;
  isAvailable: boolean;
  isPopular: boolean;
  allergens: string[];
  prepTimeMinutes: number;
  calories?: number;
  tags: string[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderType = 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface OrderItem {
  foodItem: FoodItem | string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: User | any;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  orderType: OrderType;
  status: OrderStatus;
  isVerified: boolean;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  activeOrders: number;
  recentOrders: Order[];
}

export interface Promotion {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  isValid: boolean;
  createdAt: string;
}
