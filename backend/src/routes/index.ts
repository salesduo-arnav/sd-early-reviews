import { Router } from 'express';
import authRoutes from './auth.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
