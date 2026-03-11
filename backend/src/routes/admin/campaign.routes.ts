import { Router } from 'express';
import { getCampaigns, getCampaignDetail, toggleCampaignStatus } from '../../controllers/admin/campaign.controller';

const router = Router();

router.get('/', getCampaigns);
router.get('/:id', getCampaignDetail);
router.patch('/:id/status', toggleCampaignStatus);

export default router;
