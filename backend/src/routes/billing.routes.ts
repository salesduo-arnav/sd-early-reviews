import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { getBillingSummary, getBillingHistory, downloadInvoice } from '../controllers/billing.controller';

const router = Router();

router.get('/summary', authenticateJWT, authorizeRole('SELLER'), getBillingSummary);
router.get('/history', authenticateJWT, authorizeRole('SELLER'), getBillingHistory);
router.get('/invoice/:transactionId', authenticateJWT, authorizeRole('SELLER'), downloadInvoice);

export default router;
