import { Request, Response } from 'express';
import { User, UserRole } from '../../models/User';
import { Notification, NotificationCategory } from '../../models/Notification';
import { logger, formatError } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { ADMIN_ACTIONS, BROADCAST_TARGETS } from '../../utils/constants';

export const broadcastNotification = async (req: Request, res: Response) => {
    try {
        const { target, title, message, priority, action_link } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!target || !title || !message) {
            return res.status(400).json({ message: 'Target, title, and message are required' });
        }

        let userIds: string[] = [];

        if (target === BROADCAST_TARGETS.ALL) {
            const users = await User.findAll({ attributes: ['id'] });
            userIds = users.map(u => u.id);
        } else if (target === BROADCAST_TARGETS.BUYERS) {
            const users = await User.findAll({ where: { role: UserRole.BUYER }, attributes: ['id'] });
            userIds = users.map(u => u.id);
        } else if (target === BROADCAST_TARGETS.SELLERS) {
            const users = await User.findAll({ where: { role: UserRole.SELLER }, attributes: ['id'] });
            userIds = users.map(u => u.id);
        } else if (Array.isArray(target)) {
            userIds = target;
        } else {
            return res.status(400).json({ message: 'Invalid target. Must be ALL, BUYERS, SELLERS, or an array of user IDs' });
        }

        if (userIds.length === 0) {
            return res.status(400).json({ message: 'No users found for the specified target' });
        }

        const notifications = userIds.map(userId => ({
            user_id: userId,
            category: NotificationCategory.SYSTEM_ANNOUNCEMENT,
            priority: priority || 'MEDIUM',
            title,
            message,
            action_link: action_link || null,
        }));

        await Notification.bulkCreate(notifications);

        await logAdminAction(
            adminId,
            ADMIN_ACTIONS.NOTIFICATION_BROADCAST,
            adminId,
            'NOTIFICATION',
            JSON.stringify({ target, title, recipients_count: userIds.length }),
            req.ip
        );

        return res.status(200).json({ message: `Notification sent to ${userIds.length} users` });
    } catch (error) {
        logger.error(`Error broadcasting notification: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
