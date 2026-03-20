import { Op } from 'sequelize';
import { OrderClaim, PayoutStatus, ReviewStatus } from '../models/OrderClaim';
import { SystemConfig } from '../models/SystemConfig';
import { processPayoutForClaim } from '../services/payout.service';
import { logger } from '../utils/logger';

/**
 * Auto-payout cron handler.
 * Finds all claims eligible for automatic payout and processes them.
 *
 * Eligibility:
 *   - review_status = APPROVED
 *   - payout_status = PENDING
 *   - review_approved_at <= NOW() - reimbursement_delay_days
 */
export async function runAutoPayouts(): Promise<void> {
    logger.info('[AutoPayout] Starting auto-payout run...');

    try {
        // Read delay config
        const delayConfig = await SystemConfig.findByPk('reimbursement_delay_days');
        const delayDays = delayConfig ? parseInt(delayConfig.value, 10) : 14;

        if (isNaN(delayDays) || delayDays < 0) {
            logger.error('[AutoPayout] Invalid reimbursement_delay_days config, skipping run');
            return;
        }

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - delayDays);

        // Find eligible claims
        const eligibleClaims = await OrderClaim.findAll({
            where: {
                review_status: ReviewStatus.APPROVED,
                payout_status: PayoutStatus.PENDING,
                review_approved_at: {
                    [Op.not]: null as unknown as undefined,
                    [Op.lte]: cutoffDate,
                },
            },
            attributes: ['id'],
        });

        if (eligibleClaims.length === 0) {
            logger.info('[AutoPayout] No eligible claims found');
            return;
        }

        logger.info(`[AutoPayout] Found ${eligibleClaims.length} eligible claims`);

        let processed = 0;
        let failed = 0;
        let skipped = 0;

        for (const claim of eligibleClaims) {
            const result = await processPayoutForClaim(claim.id, 'AUTO');
            if (result.success) {
                processed++;
            } else if (result.reason?.includes('no bank account') || result.reason?.includes('no bank account connected')) {
                skipped++;
            } else {
                failed++;
            }
        }

        logger.info(`[AutoPayout] Run complete: ${processed} processed, ${failed} failed, ${skipped} skipped (no bank account)`);
    } catch (error) {
        logger.error(`[AutoPayout] Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
