import { Router } from 'express';
import { getPublicConfig, updateConfig } from '../controllers/config.controller';
import { publicRateLimiter } from '../middlewares/rateLimiter';
// import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'; // uncomment when admin panel is ready

const router = Router();

// Public — rate limited to prevent abuse
router.get('/', publicRateLimiter, getPublicConfig);

// Admin-only — for future admin panel config management
// router.patch('/:key', requireAuth, requireAdmin, updateConfig);
router.patch('/:key', updateConfig); // temporary: no auth guard yet

export default router;
