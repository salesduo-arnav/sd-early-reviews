import { Request, Response } from 'express';
import { SystemConfig } from '../models/SystemConfig';
import { logger, formatError } from '../utils/logger';

/**
 * GET /api/config
 * Returns all public platform configuration values as a key-value map.
 * Safe to call without authentication — contains no sensitive data.
 */
export const getPublicConfig = async (_req: Request, res: Response) => {
    try {
        const configs = await SystemConfig.findAll();
        const configMap = configs.reduce<Record<string, string>>((acc, cfg) => {
            acc[cfg.key] = cfg.value;
            return acc;
        }, {});
        return res.status(200).json(configMap);
    } catch (error) {
        logger.error(`Error fetching system config: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error while fetching config' });
    }
};

/**
 * PATCH /api/config/:key  (admin only — to be wired through admin auth middleware later)
 * Updates a single config value by key.
 */
export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (!value) {
            return res.status(400).json({ message: 'value is required' });
        }

        const [config, created] = await SystemConfig.upsert({ key, value });
        return res.status(created ? 201 : 200).json(config);
    } catch (error) {
        logger.error(`Error updating system config: ${formatError(error)}`);
        return res.status(500).json({ message: 'Internal server error while updating config' });
    }
};
