import { Router } from 'express';
import { getDashboardStats, getSalesReport } from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/reports/sales', protect, authorize('admin'), getSalesReport);

export default router;
