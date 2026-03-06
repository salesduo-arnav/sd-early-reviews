import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../../middlewares/auth.middleware';
import { getMetrics, getReviewVelocity, getCampaignProgress, getSellerReviews, getSellerReviewStats } from '../../controllers/dashboard/seller.controller';

const router = Router();

// Dashboard routes for SELLER
router.get('/metrics', authenticateJWT, authorizeRole('SELLER'), getMetrics);
router.get('/velocity', authenticateJWT, authorizeRole('SELLER'), getReviewVelocity);
router.get('/campaign-progress', authenticateJWT, authorizeRole('SELLER'), getCampaignProgress);
router.get('/reviews', authenticateJWT, authorizeRole('SELLER'), getSellerReviews);
router.get('/reviews/stats', authenticateJWT, authorizeRole('SELLER'), getSellerReviewStats);

export default router;
