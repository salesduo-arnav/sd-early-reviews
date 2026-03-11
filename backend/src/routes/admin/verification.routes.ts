import { Router } from 'express';
import { getPendingOrders, getPendingReviews, getClaimDetail, verifyOrder, verifyReview } from '../../controllers/admin/verification.controller';

const router = Router();

router.get('/orders', getPendingOrders);
router.get('/reviews', getPendingReviews);
router.get('/:id', getClaimDetail);
router.patch('/:id/order', verifyOrder);
router.patch('/:id/review', verifyReview);

export default router;
