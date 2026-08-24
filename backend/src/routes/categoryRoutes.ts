import { Router } from 'express';
import {
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { categorySchema } from '../utils/validators';

const router = Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, authorize('admin'), validateBody(categorySchema), createCategory);
router.put('/:id', protect, authorize('admin'), validateBody(categorySchema), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
