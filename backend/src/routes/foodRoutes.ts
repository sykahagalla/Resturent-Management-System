import { Router } from 'express';
import {
  getFoodItems, getFoodItemById, getFoodItemBySlug,
  createFoodItem, updateFoodItem, deleteFoodItem, toggleAvailability,
} from '../controllers/foodController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { foodItemSchema } from '../utils/validators';

const router = Router();

router.get('/', getFoodItems);
router.get('/slug/:slug', getFoodItemBySlug);
router.get('/:id', getFoodItemById);
router.post('/', protect, authorize('admin'), validateBody(foodItemSchema), createFoodItem);
router.put('/:id', protect, authorize('admin'), validateBody(foodItemSchema), updateFoodItem);
router.delete('/:id', protect, authorize('admin'), deleteFoodItem);
router.patch('/:id/availability', protect, authorize('admin'), toggleAvailability);

export default router;
