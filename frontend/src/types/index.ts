export type UserRole = 'customer' | 'admin' | 'kitchen';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: Address;
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
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
  specialInstructions?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: User | string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  orderType: OrderType;
  status: OrderStatus;
  isVerified: boolean;
  verificationAttempts: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  deliveryAddress?: Address & { phone?: string };
  specialInstructions?: string;
  statusHistory: StatusHistoryEntry[];
  verificationCode?: string;
  estimatedPrepTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  specialInstructions?: string;
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
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  relatedOrder?: Order | string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
