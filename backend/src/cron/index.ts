import cron from 'node-cron';
import { Op } from 'sequelize';
import { runAutoPayouts } from './auto-payout.cron';
import { OrderClaim, PayoutStatus } from '../models/OrderClaim';
import { logger } from '../utils/logger';

/**
 * Initialize all cron jobs.
 * Call this once after the database connection is established.
 */
export function initCronJobs(): void {
    // Auto-payout: runs every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        await runAutoPayouts();
    });

    // Safety net: unstick PROCESSING claims older than 30 minutes → FAILED
    // Runs every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        try {
            const cutoff = new Date(Date.now() - 30 * 60 * 1000);
            const [count] = await OrderClaim.update(
                { payout_status: PayoutStatus.FAILED },
                {
                    where: {
                        payout_status: PayoutStatus.PROCESSING,
                        created_at: { [Op.lt]: cutoff },
                    },
                },
            );
            if (count > 0) {
                logger.warn(`[StuckProcessing] Reset ${count} stuck PROCESSING claims to FAILED`);
            }
        } catch (err) {
            logger.error('[StuckProcessing] Error', { err });
        }
    });

    logger.info('Cron jobs initialized: auto-payout (hourly), stuck-processing check (every 15m)');
}
