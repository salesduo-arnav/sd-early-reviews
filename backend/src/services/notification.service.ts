import Notification, { NotificationCategory, NotificationPriority } from '../models/Notification';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { NOTIFICATION_CATEGORY_CONFIG } from '../utils/notificationConfig';
import { mailService } from './mail.service';
import { getNotificationEmail } from '../utils/mailTemplates';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

// Maximum notifications to keep per user — read from env, default 15
const MAX_NOTIFICATIONS_PER_USER = parseInt(process.env.MAX_NOTIFICATIONS_PER_USER || '15', 10);

// Overrides that callers can provide when sending a notification.
// All fields are optional — defaults come from `NOTIFICATION_CATEGORY_CONFIG`.
export interface NotificationOverrides {
    title?: string;
    message?: string;
    actionLink?: string;
    priority?: NotificationPriority;
}


class NotificationService {
    /**
     * Create a notification for a single user.
     * Uses category config defaults and merges any overrides.
     * Auto-prunes old notifications beyond the cap.
     * Sends an email when the category config requires it AND priority >= HIGH.
     */
    async send(
        userId: string,
        category: NotificationCategory,
        overrides: NotificationOverrides & { message: string },
    ): Promise<Notification> {
        const config = NOTIFICATION_CATEGORY_CONFIG[category];

        const priority = overrides.priority ?? config.defaultPriority;
        const title = overrides.title ?? config.defaultTitle;
        const actionLink = overrides.actionLink ?? config.actionRoute ?? undefined;

        const notification = await Notification.create({
            user_id: userId,
            category,
            priority,
            title,
            message: overrides.message,
            action_link: actionLink,
        });

        // Prune old notifications asynchronously (non-blocking)
        this.pruneNotifications(userId).catch((err) => {
            logger.error('Failed to prune notifications', { userId, error: err });
        });

        // Send email if needed (async, non-blocking)
        // Respects buyer email_notifications_enabled preference; sellers/admins are unaffected.
        if (config.sendEmail && (priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL)) {
            const buyerProfile = await BuyerProfile.findOne({ where: { user_id: userId } });
            const emailOptedOut = buyerProfile && buyerProfile.email_notifications_enabled === false;

            if (!emailOptedOut) {
                this.sendNotificationEmail(userId, title, overrides.message, actionLink).catch((err) => {
                    logger.error('Failed to send notification email', { userId, category, error: err });
                });
            }
        }

        return notification;
    }

    /**
     * Send the same notification to multiple users (e.g. system announcements).
     */
    async sendToMany(
        userIds: string[],
        category: NotificationCategory,
        overrides: NotificationOverrides & { message: string },
    ): Promise<void> {
        await Promise.allSettled(
            userIds.map((uid) => this.send(uid, category, overrides)),
        );
    }

    /**
     * Get notifications for a user, ordered newest first.
     */
    async getForUser(userId: string, limit: number = MAX_NOTIFICATIONS_PER_USER): Promise<Notification[]> {
        return Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    /**
     * Count unread notifications for a user.
     */
    async getUnreadCount(userId: string): Promise<number> {
        return Notification.count({
            where: { user_id: userId, is_read: false },
        });
    }

    /**
     * Mark a single notification as read (with ownership verification).
     */
    async markAsRead(notificationId: string, userId: string): Promise<boolean> {
        const [affectedCount] = await Notification.update(
            { is_read: true },
            { where: { id: notificationId, user_id: userId } },
        );
        return affectedCount > 0;
    }

    /**
     * Mark all notifications as read for a user.
     */
    async markAllAsRead(userId: string): Promise<number> {
        const [affectedCount] = await Notification.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } },
        );
        return affectedCount;
    }

    /**
     * Soft-delete all notifications beyond the cap for a given user.
     * Keeps the most recent `MAX_NOTIFICATIONS_PER_USER` notifications.
     */
    async pruneNotifications(userId: string): Promise<void> {
        const keepIds = await Notification.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: MAX_NOTIFICATIONS_PER_USER,
            attributes: ['id'],
        });

        const idsToKeep = keepIds.map((n) => n.id);

        if (idsToKeep.length === 0) return;

        await Notification.destroy({
            where: {
                user_id: userId,
                id: { [Op.notIn]: idsToKeep },
            },
        });
    }

    // EMAIL HELPER
    private async sendNotificationEmail(
        userId: string,
        title: string,
        message: string,
        actionLink?: string,
    ): Promise<void> {
        const user = await User.findByPk(userId);
        if (!user) {
            logger.warn('Cannot send notification email: user not found', { userId });
            return;
        }

        const emailContent = getNotificationEmail(title, message, actionLink);
        await mailService.sendMail({
            to: user.email,
            ...emailContent,
        });
    }
}

export const notificationService = new NotificationService();
