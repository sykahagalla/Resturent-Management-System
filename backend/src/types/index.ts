import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ============ User Types ============
export type UserRole = 'customer' | 'admin' | 'kitchen';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getRefreshToken(): string;
}

// ============ Category Types ============
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ FoodItem Types ============
export interface IFoodItem extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: Types.ObjectId;
  image?: string;
  isAvailable: boolean;
  isPopular: boolean;
  allergens: string[];
  prepTimeMinutes: number;
  calories?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ Order Types ============
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
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrderItem {
  foodItem: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  updatedBy?: Types.ObjectId;
  note?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  customer: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  orderType: OrderType;
  status: OrderStatus;
  verificationCode: string; // hashed
  verificationCodeExpiry: Date;
  isVerified: boolean;
  verificationAttempts: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  specialInstructions?: string;
  statusHistory: IStatusHistoryEntry[];
  estimatedPrepTime?: number;
  isCleared: boolean;
  promotion?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Payment Types ============
export interface IPayment extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Promotion Types ============
export type PromotionType = 'percentage' | 'fixed';

export interface IPromotion extends Document {
  _id: Types.ObjectId;
  code: string;
  description: string;
  type: PromotionType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Notification Types ============
export type NotificationType = 'new_order' | 'status_update' | 'verification' | 'promotion' | 'system';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  targetRole?: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  relatedOrder?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

// ============ Review Types ============
export interface IReview extends Document {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  order: Types.ObjectId;
  foodItem?: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Express Request Extension ============
export interface AuthRequest extends Request {
  user?: IUser;
}

// ============ Socket Types ============
export interface SocketData {
  userId: string;
  role: UserRole;
}

// ============ API Response Types ============
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
