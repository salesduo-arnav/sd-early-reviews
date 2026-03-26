import { Router } from 'express';
import { getClaims } from '../../controllers/admin/claim.controller';

const router = Router();

router.get('/', getClaims);

export default router;
