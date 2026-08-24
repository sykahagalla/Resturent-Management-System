import { Router } from 'express';
import { createReview, getFoodItemReviews, getAllReviews, getMyReviews, updateReview, deleteReview } from '../controllers/reviewController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { reviewSchema } from '../utils/validators';

const router = Router();

router.post('/', protect, authorize('customer'), validateBody(reviewSchema), createReview);
router.get('/mine', protect, authorize('customer'), getMyReviews);
router.get('/food/:foodItemId', getFoodItemReviews);
router.get('/', protect, authorize('admin'), getAllReviews);
router.put('/:id', protect, authorize('customer'), validateBody(reviewSchema), updateReview);
router.delete('/:id', protect, deleteReview); // Auth check in controller since it can be admin or customer

export default router;
