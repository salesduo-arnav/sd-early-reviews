import { Router } from 'express';
import { getMetrics, getRevenueChart, getClaimsChart, getUsersChart } from '../../controllers/admin/dashboard.controller';

const router = Router();

router.get('/metrics', getMetrics);
router.get('/revenue-chart', getRevenueChart);
router.get('/claims-chart', getClaimsChart);
router.get('/users-chart', getUsersChart);

export default router;
