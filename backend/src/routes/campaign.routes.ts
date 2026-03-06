import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
    lookupAsin,
    createCampaign,
    getCampaigns,
    getCampaign,
    toggleCampaignStatus
} from '../controllers/campaign.controller';

const router = Router();

// Seller only route middleware
router.use(authenticateJWT);
router.use(authorizeRole('SELLER'));

router.get('/lookup', lookupAsin);
router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaign);
router.patch('/:id/status', toggleCampaignStatus);

export default router;
