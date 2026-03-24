import { Op } from 'sequelize';
import { OrderClaim, PayoutStatus, ReviewStatus } from '../models/OrderClaim';
import { Campaign } from '../models/Campaign';
import { SystemConfig } from '../models/SystemConfig';
import { processPayoutForClaim } from '../services/payout.service';
import { regionToCurrency } from '../services/wise.service';
import { logger, formatError } from '../utils/logger';
import { CONFIG_KEYS } from '../utils/constants';

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
        // Read configs
        const [delayConfig, maxAmountConfig] = await Promise.all([
            SystemConfig.findByPk(CONFIG_KEYS.REIMBURSEMENT_DELAY_DAYS),
            SystemConfig.findByPk(CONFIG_KEYS.AUTO_PAYOUT_MAX_AMOUNT),
        ]);

        const delayDays = delayConfig ? parseInt(delayConfig.value, 10) : 14;
        if (isNaN(delayDays) || delayDays < 0) {
            logger.error('[AutoPayout] Invalid reimbursement_delay_days config, skipping run');
            return;
        }

        let maxAmounts: Record<string, number> | null = null;
        if (maxAmountConfig) {
            try {
                maxAmounts = JSON.parse(maxAmountConfig.value);
            } catch {
                logger.error('[AutoPayout] Invalid auto_payout_max_amount config (expected JSON), skipping amount filter');
            }
        }

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - delayDays);

        // Fetch eligible claims including campaign region so we can apply per-currency amount limits
        const eligibleClaims = await OrderClaim.findAll({
            where: {
                review_status: ReviewStatus.APPROVED,
                payout_status: PayoutStatus.PENDING,
                review_approved_at: {
                    [Op.not]: null as unknown as undefined,
                    [Op.lte]: cutoffDate,
                },
            },
            attributes: ['id', 'expected_payout_amount'],
            include: [{ model: Campaign, attributes: ['region'] }],
        });

        // Filter out claims that exceed the per-currency limit — those require manual admin payout
        let heldBack = 0;
        const claimsToProcess = maxAmounts
            ? eligibleClaims.filter((claim) => {
                  const campaignData = claim.get('Campaign') as { region: string } | undefined;
                  const region = campaignData?.region ?? 'com';
                  const currency = regionToCurrency(region);
                  const limit = maxAmounts![currency];
                  if (limit !== undefined && Number(claim.expected_payout_amount) > limit) {
                      heldBack++;
                      return false;
                  }
                  return true;
              })
            : eligibleClaims;

        if (claimsToProcess.length === 0) {
            logger.info(`[AutoPayout] No eligible claims found${heldBack > 0 ? ` (${heldBack} held back — exceed per-currency limit)` : ''}`);
            return;
        }

        logger.info(`[AutoPayout] Found ${claimsToProcess.length} claims to process${heldBack > 0 ? `, ${heldBack} held back for manual admin payout` : ''}`);

        let processed = 0;
        let failed = 0;
        let skipped = 0;

        for (const claim of claimsToProcess) {
            const result = await processPayoutForClaim(claim.id, 'AUTO');
            if (result.success) {
                processed++;
            } else if (result.reason?.includes('no bank account') || result.reason?.includes('no bank account connected')) {
                skipped++;
            } else {
                failed++;
            }
        }

        logger.info(`[AutoPayout] Run complete: ${processed} processed, ${failed} failed, ${skipped} skipped (no bank account), ${heldBack} held for manual review`);
    } catch (error) {
        logger.error(`[AutoPayout] Unexpected error: ${formatError(error)}`);
    }
}
