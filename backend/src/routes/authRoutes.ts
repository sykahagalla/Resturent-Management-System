import { Router } from 'express';
import { register, login, getMe, refreshToken } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema } from '../utils/validators';
import { authLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);

export default router;
