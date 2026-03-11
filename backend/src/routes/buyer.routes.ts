import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
    getMyClaims,
    getClaimDetail,
    submitReviewProof,
    cancelClaim,
    getAccountProfile,
    updateBankDetails,
    removeBankDetails,
    updateNotificationPreferences,
} from '../controllers/buyer.controller';

const router = Router();

// All buyer routes require authentication as BUYER
router.use(authenticateJWT);
router.use(authorizeRole('BUYER'));

// Claims
router.get('/claims', getMyClaims);
router.get('/claims/:id', getClaimDetail);
router.post('/claims/:id/review', submitReviewProof);
router.delete('/claims/:id', cancelClaim);

// Profile & Earnings
router.get('/profile', getAccountProfile);
router.put('/bank-details', updateBankDetails);
router.delete('/bank-details', removeBankDetails);
router.patch('/notifications', updateNotificationPreferences);

export default router;
