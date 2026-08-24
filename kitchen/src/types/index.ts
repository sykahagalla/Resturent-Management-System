export type UserRole = 'customer' | 'admin' | 'kitchen';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
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

export interface OrderItem {
  foodItem: any;
  name: string;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  orderType: OrderType;
  status: OrderStatus;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}
