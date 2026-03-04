import { Router } from 'express';
import sellerRoutes from './seller.routes';

const router = Router();

router.use('/seller', sellerRoutes);

export default router;
