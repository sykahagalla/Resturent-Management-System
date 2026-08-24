import { Router } from 'express';
import { getKitchenQueue, getKitchenOrderDetail, getCompletedToday } from '../controllers/kitchenController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/queue', protect, authorize('kitchen', 'admin'), getKitchenQueue);
router.get('/completed', protect, authorize('kitchen', 'admin'), getCompletedToday);
router.get('/orders/:id', protect, authorize('kitchen', 'admin'), getKitchenOrderDetail);

export default router;
