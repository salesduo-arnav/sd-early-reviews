import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../../middlewares/auth.middleware';
import dashboardRoutes from './dashboard.routes';
import verificationRoutes from './verification.routes';
import buyerRoutes from './buyer.routes';
import sellerRoutes from './seller.routes';
import campaignRoutes from './campaign.routes';
import payoutRoutes from './payout.routes';
import transactionRoutes from './transaction.routes';
import configRoutes from './config.routes';
import auditLogRoutes from './audit-log.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticateJWT);
router.use(authorizeRole('ADMIN'));

router.use('/dashboard', dashboardRoutes);
router.use('/verifications', verificationRoutes);
router.use('/buyers', buyerRoutes);
router.use('/sellers', sellerRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/payouts', payoutRoutes);
router.use('/transactions', transactionRoutes);
router.use('/config', configRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/notifications', notificationRoutes);

export default router;
