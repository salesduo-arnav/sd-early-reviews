// Admin-configurable system config — single source of truth
// Keys, defaults, and descriptions are co-located so nothing can drift
export const SYSTEM_CONFIGS = {
    AUTO_ORDER_VERIFICATION: {
        key: 'auto_order_verification_enabled',
        defaultValue: 'true',
        description: 'Enable automatic order verification via SP-API',
    },
    AUTO_REVIEW_VERIFICATION: {
        key: 'auto_review_verification_enabled',
        defaultValue: 'true',
        description: 'Enable automatic review verification via profile scraping',
    },
    PLATFORM_FEE_PERCENT: {
        key: 'platform_fee_percent',
        defaultValue: '10',
        description: 'Platform fee percentage charged on campaign reimbursement costs',
    },
    REIMBURSEMENT_DELAY_DAYS: {
        key: 'reimbursement_delay_days',
        defaultValue: '14',
        description: 'Number of days after review approval before auto-payout',
    },
    AUTO_PAYOUT_ENABLED: {
        key: 'auto_payout_enabled',
        defaultValue: 'true',
        description: 'Enable or disable automatic payouts. When disabled, all payouts require manual admin processing.',
    },
    AUTO_PAYOUT_CRON_SCHEDULE: {
        key: 'auto_payout_cron_schedule',
        defaultValue: '0 * * * *',
        description: 'Cron schedule for auto-payout job (cron expression, e.g. "0 * * * *" = every hour)',
    },
    AUTO_PAYOUT_MAX_AMOUNT: {
        key: 'auto_payout_max_amount',
        defaultValue: '{"USD":100,"GBP":80,"EUR":90,"INR":8000,"JPY":15000,"AUD":150,"CAD":135,"BRL":500,"MXN":2000,"SGD":135,"AED":365,"SAR":375,"PLN":400,"SEK":1050}',
        description: 'Per-currency max payout amount for auto-payout (JSON map of currency code to amount). Claims above the limit for their currency require manual admin approval.',
    },
    REVIEW_VERIFICATION_CONFIDENCE_THRESHOLD: {
        key: 'review_verification_confidence_threshold',
        defaultValue: '85',
        description: 'Minimum confidence score (0-100) required for automatic review verification approval',
    },
    NEW_CAMPAIGN_NOTIFICATIONS: {
        key: 'new_campaign_notifications_enabled',
        defaultValue: 'false',
        description: 'Enable or disable buyer notifications when new campaigns match their interests',
    },
} as const;

// Flat config key lookup derived from SYSTEM_CONFIGS (zero duplication)
export const CONFIG_KEYS = Object.fromEntries(
    Object.entries(SYSTEM_CONFIGS).map(([k, v]) => [k, v.key]),
) as { [K in keyof typeof SYSTEM_CONFIGS]: (typeof SYSTEM_CONFIGS)[K]['key'] };

// Admin audit log actions
export const ADMIN_ACTIONS = {
    VERIFY_ORDER_APPROVED: 'VERIFY_ORDER_APPROVED',
    VERIFY_ORDER_REJECTED: 'VERIFY_ORDER_REJECTED',
    VERIFY_REVIEW_APPROVED: 'VERIFY_REVIEW_APPROVED',
    VERIFY_REVIEW_REJECTED: 'VERIFY_REVIEW_REJECTED',
    PAYOUT_PROCESSED: 'PAYOUT_PROCESSED',
    PAYOUT_FAILED: 'PAYOUT_FAILED',
    CAMPAIGN_PAUSED: 'CAMPAIGN_PAUSED',
    CAMPAIGN_RESUMED: 'CAMPAIGN_RESUMED',
    BUYER_BLACKLISTED: 'BUYER_BLACKLISTED',
    BUYER_UNBLACKLISTED: 'BUYER_UNBLACKLISTED',
    CONFIG_UPDATED: 'CONFIG_UPDATED',
    CONFIG_CREATED: 'CONFIG_CREATED',
    CONFIG_DELETED: 'CONFIG_DELETED',
    NOTIFICATION_BROADCAST: 'NOTIFICATION_BROADCAST',
    PAYOUT_RETRIED: 'PAYOUT_RETRIED',
} as const;

// SP-API authorization statuses
export const SPAPI_AUTH_STATUS = {
    AUTHORIZED: 'AUTHORIZED',
    REVOKED: 'REVOKED',
} as const;

// Verification methods
export const VERIFICATION_METHOD = {
    MANUAL: 'MANUAL',
    AUTO_SP_API: 'AUTO_SP_API',
    AUTO_PROFILE_SCRAPE: 'AUTO_PROFILE_SCRAPE',
} as const;

// Broadcast notification targets
export const BROADCAST_TARGETS = {
    ALL: 'ALL',
    BUYERS: 'BUYERS',
    SELLERS: 'SELLERS',
} as const;
