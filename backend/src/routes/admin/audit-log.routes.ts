import { Router } from 'express';
import { getAuditLogs } from '../../controllers/admin/audit-log.controller';

const router = Router();

router.get('/', getAuditLogs);

export default router;
