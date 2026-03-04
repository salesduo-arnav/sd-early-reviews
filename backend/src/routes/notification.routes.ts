import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticateJWT);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);     // Must be before /:id to avoid conflict
router.patch('/:id/read', markAsRead);

export default router;
