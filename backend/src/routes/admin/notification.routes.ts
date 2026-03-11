import { Router } from 'express';
import { broadcastNotification } from '../../controllers/admin/notification.controller';

const router = Router();

router.post('/broadcast', broadcastNotification);

export default router;
