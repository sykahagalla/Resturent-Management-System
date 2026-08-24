import { Router } from 'express';
import {
  getPromotions, getActivePromotions, getPromotionById,
  createPromotion, updatePromotion, deletePromotion, validatePromoCode,
} from '../controllers/promotionController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { promotionSchema, validatePromoSchema } from '../utils/validators';

const router = Router();

router.get('/active', getActivePromotions);
router.post('/validate', protect, validateBody(validatePromoSchema), validatePromoCode);

router.get('/', protect, authorize('admin'), getPromotions);
router.get('/:id', protect, authorize('admin'), getPromotionById);
router.post('/', protect, authorize('admin'), validateBody(promotionSchema), createPromotion);
router.put('/:id', protect, authorize('admin'), validateBody(promotionSchema), updatePromotion);
router.delete('/:id', protect, authorize('admin'), deletePromotion);

export default router;
