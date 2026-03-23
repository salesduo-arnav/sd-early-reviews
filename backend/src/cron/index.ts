import cron, { ScheduledTask } from 'node-cron';
import { Op } from 'sequelize';
import { runAutoPayouts } from './auto-payout.cron';
import { OrderClaim, PayoutStatus } from '../models/OrderClaim';
import { SystemConfig } from '../models/SystemConfig';
import { logger } from '../utils/logger';

const DEFAULT_AUTO_PAYOUT_SCHEDULE = '0 * * * *';

let autoPayoutTask: ScheduledTask | null = null;

async function getAutoPayoutSchedule(): Promise<string> {
    const config = await SystemConfig.findByPk('auto_payout_cron_schedule');
    return config?.value || DEFAULT_AUTO_PAYOUT_SCHEDULE;
}

/**
 * Initialize all cron jobs.
 * Call this once after the database connection is established.
 */
export async function initCronJobs(): Promise<void> {
    const autoPayoutSchedule = await getAutoPayoutSchedule();

    // Auto-payout: schedule is admin-configurable via auto_payout_cron_schedule system config
    autoPayoutTask = cron.schedule(autoPayoutSchedule, async () => {
        await runAutoPayouts();
    });

    // Safety net: unstick PROCESSING claims older than 30 minutes → FAILED
    // Fixed at every 15 minutes — not admin-configurable
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

    logger.info(`Cron jobs initialized: auto-payout (${autoPayoutSchedule}), stuck-processing check (every 15m)`);
}

/**
 * Reload the auto-payout cron with the current schedule from SystemConfig.
 * Call this after updating the auto_payout_cron_schedule config key.
 * Returns the new schedule string.
 */
export async function reloadAutoPayoutCron(): Promise<string> {
    const newSchedule = await getAutoPayoutSchedule();

    if (autoPayoutTask) {
        autoPayoutTask.stop();
    }

    autoPayoutTask = cron.schedule(newSchedule, async () => {
        await runAutoPayouts();
    });

    logger.info(`[AutoPayout] Cron reloaded with schedule: ${newSchedule}`);
    return newSchedule;
}
