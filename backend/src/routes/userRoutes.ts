import { Router } from 'express';
import {
  getProfile, updateProfile, changePassword,
  getUsers, getUserById, updateUser, deleteUser,
} from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { updateProfileSchema, changePasswordSchema } from '../utils/validators';

const router = Router();

// Customer routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validateBody(updateProfileSchema), updateProfile);
router.put('/change-password', protect, validateBody(changePasswordSchema), changePassword);

// Admin routes
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
