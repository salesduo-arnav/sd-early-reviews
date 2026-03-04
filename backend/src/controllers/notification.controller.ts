import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

/**
 * GET /api/notifications
 * Returns notifications for the authenticated user, newest first.
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || undefined;
        const notifications = await notificationService.getForUser(userId, limit);

        res.status(200).json({ notifications });
    } catch (error) {
        logger.error('Get notifications error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user.
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const count = await notificationService.getUnreadCount(userId);

        res.status(200).json({ unreadCount: count });
    } catch (error) {
        logger.error('Get unread count error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read (with ownership check).
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const success = await notificationService.markAsRead(id, userId);

        if (!success) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        logger.error('Mark as read error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications as read for the authenticated user.
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const count = await notificationService.markAllAsRead(userId);

        res.status(200).json({ message: `${count} notification(s) marked as read` });
    } catch (error) {
        logger.error('Mark all as read error', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
