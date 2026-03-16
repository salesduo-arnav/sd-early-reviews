import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { getSpapiAuthUrl, getSpapiStatus, revokeSpapiAuth } from '../controllers/spapi.controller';

const router = Router();

// All routes require authenticated SELLER role
router.get('/auth-url', authenticateJWT, authorizeRole('SELLER'), getSpapiAuthUrl);
router.get('/status', authenticateJWT, authorizeRole('SELLER'), getSpapiStatus);
router.post('/revoke', authenticateJWT, authorizeRole('SELLER'), revokeSpapiAuth);

export default router;
