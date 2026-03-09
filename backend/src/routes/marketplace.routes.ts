import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
    getMarketplaceProducts,
    getMarketplaceProduct,
    getMarketplaceFilters,
    claimProduct,
} from '../controllers/marketplace.controller';

const router = Router();

// Public-ish browsing endpoints (still require auth as BUYER)
router.use(authenticateJWT);
router.use(authorizeRole('BUYER'));

router.get('/', getMarketplaceProducts);
router.get('/filters', getMarketplaceFilters);
router.get('/:id', getMarketplaceProduct);
router.post('/:id/claim', claimProduct);

export default router;
