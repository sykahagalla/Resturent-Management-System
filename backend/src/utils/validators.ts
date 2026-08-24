import { z } from 'zod';

// ============ Auth Schemas ============
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin', 'kitchen']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============ Category Schemas ============
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ============ FoodItem Schemas ============
export const foodItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  image: z.string().optional(),
  isAvailable: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  calories: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

// ============ Order Schemas ============
export const createOrderSchema = z.object({
  items: z.array(z.object({
    foodItem: z.string().min(1, 'Food item ID is required'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    specialInstructions: z.string().max(200).optional(),
  })).min(1, 'Order must have at least one item'),
  orderType: z.enum(['takeaway', 'delivery']),
  paymentMethod: z.enum(['cash', 'card', 'online']),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    phone: z.string().min(1),
  }).optional(),
  specialInstructions: z.string().max(500).optional(),
  promotionCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled']),
  note: z.string().max(200).optional(),
});

// ============ Verification Schemas ============
export const verifyOrderSchema = z.object({
  verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
});

// ============ Promotion Schemas ============
export const promotionSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  description: z.string().min(1, 'Description is required').max(200),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Value must be positive'),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  startDate: z.string().datetime().or(z.string()),
  endDate: z.string().datetime().or(z.string()),
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().nonnegative().optional(),
});

export const validatePromoSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  orderAmount: z.number().positive('Order amount must be positive'),
});

// ============ User Update Schema ============
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ============ Review Schema ============
export const reviewSchema = z.object({
  order: z.string().optional(),
  foodItem: z.string().min(1, 'Food Item ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// ============ Payment Schema ============
export const updatePaymentSchema = z.object({
  status: z.enum(['completed', 'failed', 'refunded']),
  transactionId: z.string().optional(),
});
