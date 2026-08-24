import {
  generateOrderNumber,
  generateVerificationCode,
  verifyCode,
  getVerificationExpiry,
  isCodeExpired,
  calculateOrderTotals,
} from '../../src/utils/helpers';
import { describe, it, expect } from '@jest/globals';

describe('Helper Utils', () => {
  describe('generateOrderNumber', () => {
    it('should generate a valid order number starting with ORD-', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber.startsWith('ORD-')).toBe(true);
      expect(orderNumber.length).toBeGreaterThan(6);
    });
  });

  describe('Verification Codes', () => {
    it('should generate a 6-digit code', async () => {
      const code = await generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should correctly verify codes', async () => {
      const result = await verifyCode('123456', '123456');
      expect(result).toBe(true);
      
      const failedResult = await verifyCode('123456', '654321');
      expect(failedResult).toBe(false);
    });
  });

  describe('Expiry Dates', () => {
    it('should correctly determine expiration', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);
      expect(isCodeExpired(futureDate)).toBe(false);

      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);
      expect(isCodeExpired(pastDate)).toBe(true);
    });
  });

  describe('calculateOrderTotals', () => {
    it('should calculate totals correctly without discount', () => {
      const items = [{ price: 10, quantity: 2 }, { price: 5, quantity: 1 }];
      const totals = calculateOrderTotals(items, 0.1, 0); // 10% tax
      
      expect(totals.subtotal).toBe(25);
      expect(totals.tax).toBe(2.5);
      expect(totals.discount).toBe(0);
      expect(totals.total).toBe(27.5);
    });
  });
});
