import { Router } from 'express';
import { getConfigs, updateConfig, createConfig, deleteConfig } from '../../controllers/admin/config.controller';

const router = Router();

router.get('/', getConfigs);
router.post('/', createConfig);
router.patch('/:key', updateConfig);
router.delete('/:key', deleteConfig);

export default router;
