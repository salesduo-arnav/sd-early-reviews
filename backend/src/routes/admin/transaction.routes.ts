import { Router } from 'express';
import { getTransactions } from '../../controllers/admin/transaction.controller';

const router = Router();

router.get('/', getTransactions);

export default router;
