import { Router } from 'express';
import authRoutes from './auth.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard';
import campaignRoutes from './campaign.routes';
import configRoutes from './config.routes';
import marketplaceRoutes from './marketplace.routes';
import uploadRoutes from './upload.routes';
import buyerRoutes from './buyer.routes';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/config', configRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/uploads', uploadRoutes);
router.use('/buyer', buyerRoutes);

export default router;
