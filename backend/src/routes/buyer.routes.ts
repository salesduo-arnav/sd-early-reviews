import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
    getMyClaims,
    getClaimDetail,
    submitReviewProof,
    cancelClaim,
} from '../controllers/buyer.controller';

const router = Router();

// All buyer routes require authentication as BUYER
router.use(authenticateJWT);
router.use(authorizeRole('BUYER'));

router.get('/claims', getMyClaims);
router.get('/claims/:id', getClaimDetail);
router.post('/claims/:id/review', submitReviewProof);
router.delete('/claims/:id', cancelClaim);

export default router;
