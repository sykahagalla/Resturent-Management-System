import crypto from 'crypto';

/**
 * Generate a unique order number in format ORD-XXXXXX
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp.slice(-3)}${random.slice(0, 3)}`;
};

/**
 * Generate a secure 6-digit verification code
 * Returns the plain code (to store and show customer)
 */
export const generateVerificationCode = async (): Promise<string> => {
  // Generate cryptographically secure 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
};

/**
 * Verify a code
 */
export const verifyCode = async (enteredCode: string, actualCode: string): Promise<boolean> => {
  return enteredCode === actualCode;
};

/**
 * Calculate verification code expiry time
 */
export const getVerificationExpiry = (minutes: number = 30): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

/**
 * Check if a verification code has expired
 */
export const isCodeExpired = (expiryDate: Date): boolean => {
  return new Date() > new Date(expiryDate);
};

/**
 * Generate a mock transaction ID for payments
 */
export const generateTransactionId = (): string => {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

/**
 * Calculate order totals
 */
export const calculateOrderTotals = (
  items: { price: number; quantity: number }[],
  taxRate: number = 0.05,
  discountAmount: number = 0
): { subtotal: number; tax: number; discount: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const discount = Math.min(discountAmount, subtotal);
  const total = Math.round((subtotal + tax - discount) * 100) / 100;

  return { subtotal, tax, discount, total };
};
