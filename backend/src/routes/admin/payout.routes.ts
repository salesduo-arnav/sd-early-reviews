import { Router } from 'express';
import { getPayouts, updatePayoutStatus, batchUpdatePayouts } from '../../controllers/admin/payout.controller';

const router = Router();

router.get('/', getPayouts);
router.patch('/:id', updatePayoutStatus);
router.post('/batch', batchUpdatePayouts);

export default router;
