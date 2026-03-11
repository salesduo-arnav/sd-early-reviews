import { AdminAuditLog } from '../models/AdminAuditLog';
import { logger } from './logger';

export async function logAdminAction(
    adminId: string,
    action: string,
    targetId: string,
    targetType: string,
    details?: string,
    ipAddress?: string
): Promise<void> {
    try {
        await AdminAuditLog.create({
            admin_id: adminId,
            action,
            target_id: targetId,
            target_type: targetType,
            details,
            ip_address: ipAddress,
        });
    } catch (error) {
        logger.error(`Failed to log admin action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
