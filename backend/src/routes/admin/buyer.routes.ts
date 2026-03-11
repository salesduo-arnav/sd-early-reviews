import { Router } from 'express';
import { getBuyers, getBuyerDetail, toggleBlacklist } from '../../controllers/admin/buyer.controller';

const router = Router();

router.get('/', getBuyers);
router.get('/:id', getBuyerDetail);
router.patch('/:id/blacklist', toggleBlacklist);

export default router;
