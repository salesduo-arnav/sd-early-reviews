import { Router } from 'express';
import { getPayouts, updatePayoutStatus, batchUpdatePayouts, retryPayout } from '../../controllers/admin/payout.controller';

const router = Router();

router.get('/', getPayouts);
router.patch('/:id', updatePayoutStatus);
router.post('/batch', batchUpdatePayouts);
router.post('/:id/retry', retryPayout);

export default router;
