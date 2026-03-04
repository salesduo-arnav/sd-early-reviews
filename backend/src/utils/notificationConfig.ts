import { NotificationCategory, NotificationPriority } from '../models/Notification';

export interface CategoryConfig {
    defaultTitle: string;
    defaultPriority: NotificationPriority;
    actionRoute: string | null;
    sendEmail: boolean;
}

export const NOTIFICATION_CATEGORY_CONFIG: Record<NotificationCategory, CategoryConfig> = {
    // BUYER FACING
    [NotificationCategory.ORDER_APPROVED]: {
        defaultTitle: 'Order Approved',
        defaultPriority: NotificationPriority.MEDIUM,
        actionRoute: '/buyer/orders',
        sendEmail: false,
    },
    [NotificationCategory.ORDER_REJECTED]: {
        defaultTitle: 'Order Rejected',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/buyer/orders',
        sendEmail: true,
    },
    [NotificationCategory.REVIEW_APPROVED]: {
        defaultTitle: 'Review Approved',
        defaultPriority: NotificationPriority.MEDIUM,
        actionRoute: '/buyer/reviews',
        sendEmail: false,
    },
    [NotificationCategory.REVIEW_REJECTED]: {
        defaultTitle: 'Review Rejected',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/buyer/reviews',
        sendEmail: true,
    },
    [NotificationCategory.PAYOUT_PROCESSED]: {
        defaultTitle: 'Payout Processed',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/buyer/payouts',
        sendEmail: true,
    },
    [NotificationCategory.PAYOUT_FAILED]: {
        defaultTitle: 'Payout Failed',
        defaultPriority: NotificationPriority.CRITICAL,
        actionRoute: '/buyer/payouts',
        sendEmail: true,
    },
    [NotificationCategory.REVIEW_DEADLINE]: {
        defaultTitle: 'Review Deadline Approaching',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/buyer/reviews',
        sendEmail: true,
    },

    // SELLER FACING
    [NotificationCategory.CAMPAIGN_CREATED]: {
        defaultTitle: 'Campaign Created',
        defaultPriority: NotificationPriority.LOW,
        actionRoute: '/seller/campaigns',
        sendEmail: false,
    },
    [NotificationCategory.CAMPAIGN_PAUSED]: {
        defaultTitle: 'Campaign Paused',
        defaultPriority: NotificationPriority.MEDIUM,
        actionRoute: '/seller/campaigns',
        sendEmail: false,
    },
    [NotificationCategory.CAMPAIGN_COMPLETED]: {
        defaultTitle: 'Campaign Completed',
        defaultPriority: NotificationPriority.MEDIUM,
        actionRoute: '/seller/campaigns',
        sendEmail: false,
    },
    [NotificationCategory.NEW_ORDER_CLAIM]: {
        defaultTitle: 'New Order Claim',
        defaultPriority: NotificationPriority.MEDIUM,
        actionRoute: '/seller/claims',
        sendEmail: false,
    },
    [NotificationCategory.REVIEW_SUBMITTED]: {
        defaultTitle: 'Review Submitted',
        defaultPriority: NotificationPriority.MEDIUM,
        actionRoute: '/seller/reviews',
        sendEmail: false,
    },
    [NotificationCategory.SELLER_PAYMENT_DUE]: {
        defaultTitle: 'Payment Due',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/seller/billing',
        sendEmail: true,
    },

    // ADMIN FACING
    [NotificationCategory.ADMIN_VERIFICATION_NEEDED]: {
        defaultTitle: 'Verification Required',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/admin/verifications',
        sendEmail: true,
    },
    [NotificationCategory.ADMIN_FLAGGED_USER]: {
        defaultTitle: 'User Flagged',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/admin/users',
        sendEmail: true,
    },

    // SHARED
    [NotificationCategory.SYSTEM_ANNOUNCEMENT]: {
        defaultTitle: 'System Announcement',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: null,
        sendEmail: true,
    },
    [NotificationCategory.WELCOME]: {
        defaultTitle: 'Welcome to SalesDuo!',
        defaultPriority: NotificationPriority.HIGH,
        actionRoute: '/',
        sendEmail: true,
    },
};
