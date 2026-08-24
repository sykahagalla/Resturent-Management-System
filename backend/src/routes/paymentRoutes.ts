import { Router } from 'express';
import { getPaymentByOrder, updatePaymentStatus, getPayments } from '../controllers/paymentController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { updatePaymentSchema } from '../utils/validators';

const router = Router();

router.get('/', protect, authorize('admin'), getPayments);
router.get('/order/:orderId', protect, getPaymentByOrder);
router.put('/:id', protect, authorize('admin'), validateBody(updatePaymentSchema), updatePaymentStatus);

export default router;
