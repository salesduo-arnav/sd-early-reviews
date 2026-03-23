import { Request, Response } from 'express';
import { SystemConfig } from '../../models/SystemConfig';
import { logger } from '../../utils/logger';
import { logAdminAction } from '../../utils/auditLog';
import { reloadAutoPayoutCron } from '../../cron';

export const getConfigs = async (req: Request, res: Response) => {
    try {
        const configs = await SystemConfig.findAll({ order: [['key', 'ASC']] });
        return res.status(200).json(configs);
    } catch (error) {
        logger.error(`Error fetching configs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (value === undefined || value === null) {
            return res.status(400).json({ message: 'Value is required' });
        }

        const config = await SystemConfig.findByPk(key);
        if (!config) return res.status(404).json({ message: 'Config key not found' });

        // Validate cron expression before saving
        if (key === 'auto_payout_cron_schedule') {
            const cron = await import('node-cron');
            if (!cron.validate(String(value))) {
                return res.status(400).json({ message: 'Invalid cron expression' });
            }
        }

        // Validate per-currency JSON map before saving
        if (key === 'auto_payout_max_amount') {
            try {
                const parsed = JSON.parse(String(value));
                if (typeof parsed !== 'object' || Array.isArray(parsed) || Object.values(parsed).some(v => typeof v !== 'number')) {
                    return res.status(400).json({ message: 'auto_payout_max_amount must be a JSON object mapping currency codes to numbers (e.g. {"USD":100,"GBP":80})' });
                }
            } catch {
                return res.status(400).json({ message: 'auto_payout_max_amount must be valid JSON' });
            }
        }

        const oldValue = config.value;
        await config.update({ value: String(value) });

        await logAdminAction(
            adminId,
            'CONFIG_UPDATED',
            key,
            'SYSTEM_CONFIG',
            JSON.stringify({ old_value: oldValue, new_value: value }),
            req.ip
        );

        // Reload auto-payout cron live if its schedule was changed
        if (key === 'auto_payout_cron_schedule') {
            const newSchedule = await reloadAutoPayoutCron();
            return res.status(200).json({ message: 'Config updated and cron reloaded', config, cron_schedule: newSchedule });
        }

        return res.status(200).json({ message: 'Config updated successfully', config });
    } catch (error) {
        logger.error(`Error updating config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const createConfig = async (req: Request, res: Response) => {
    try {
        const { key, value, description } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!key || value === undefined) {
            return res.status(400).json({ message: 'Key and value are required' });
        }

        const existing = await SystemConfig.findByPk(key);
        if (existing) return res.status(409).json({ message: 'Config key already exists' });

        const config = await SystemConfig.create({ key, value: String(value), description });

        await logAdminAction(adminId, 'CONFIG_CREATED', key, 'SYSTEM_CONFIG', JSON.stringify({ value, description }), req.ip);

        return res.status(201).json({ message: 'Config created successfully', config });
    } catch (error) {
        logger.error(`Error creating config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteConfig = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

        const config = await SystemConfig.findByPk(key);
        if (!config) return res.status(404).json({ message: 'Config key not found' });

        await config.destroy();

        await logAdminAction(adminId, 'CONFIG_DELETED', key, 'SYSTEM_CONFIG', JSON.stringify({ deleted_key: key }), req.ip);

        return res.status(200).json({ message: 'Config deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
