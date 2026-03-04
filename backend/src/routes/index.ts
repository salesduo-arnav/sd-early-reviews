import { Router } from 'express';
import authRoutes from './auth.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);

export default router;
