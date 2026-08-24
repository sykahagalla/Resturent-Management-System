import { Router } from 'express';
import {
  createOrder, getOrders, getOrderById, getOrderByNumber,
  updateOrderStatus, cancelOrder, getMyOrders, clearOrder
} from '../controllers/orderController';
import { verifyOrder, getVerificationStatus } from '../controllers/verificationController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { createOrderSchema, updateOrderStatusSchema, verifyOrderSchema } from '../utils/validators';
import { orderLimiter, verificationLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

// Customer routes
router.post('/', protect, authorize('customer'), orderLimiter, validateBody(createOrderSchema), createOrder);
router.get('/my-orders', protect, authorize('customer'), getMyOrders);
router.get('/track/:orderNumber', protect, getOrderByNumber);

// Admin/Kitchen routes
router.get('/', protect, authorize('admin', 'kitchen'), getOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('admin', 'kitchen'), validateBody(updateOrderStatusSchema), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/clear', protect, authorize('admin', 'kitchen'), clearOrder);

// Verification routes
router.post('/:id/verify', protect, authorize('admin', 'kitchen'), verificationLimiter, validateBody(verifyOrderSchema), verifyOrder);
router.get('/:id/verification-status', protect, getVerificationStatus);

export default router;
