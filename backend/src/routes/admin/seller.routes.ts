import { Router } from 'express';
import { getSellers, getSellerDetail } from '../../controllers/admin/seller.controller';

const router = Router();

router.get('/', getSellers);
router.get('/:id', getSellerDetail);

export default router;
