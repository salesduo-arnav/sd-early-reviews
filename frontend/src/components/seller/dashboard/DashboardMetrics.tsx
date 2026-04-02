import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import { dashboardApi, DashboardMetrics as IDashboardMetrics } from '@/api/seller';
import { getErrorMessage } from '@/lib/errors';
import { formatPriceByCurrency } from '@/lib/regions';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardMetrics() {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<IDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await dashboardApi.getSellerMetrics();
                setMetrics(data);
            } catch (err: unknown) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-4 mb-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md flex items-center">
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    if (!metrics) return null;

    const isPositiveChange = metrics.reviewChangePercent >= 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.dashboard.active_campaigns', 'Active Campaigns')}
                    </CardTitle>
                    <Package className="w-4 h-4 text-brand-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('seller.dashboard.currently_running', 'Currently running')}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.dashboard.total_reviews', 'Total Reviews Completed')}
                    </CardTitle>
                    <TrendingUp className="w-4 h-4 text-brand-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalReviews}</div>
                    <p className={`text-xs mt-1 ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositiveChange ? '+' : ''}{metrics.reviewChangePercent}% {t('seller.dashboard.this_week', 'this week')}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.dashboard.total_amount_spent', 'Total Amount Spent')}
                    </CardTitle>
                    <DollarSign className="w-4 h-4 text-brand-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatPriceByCurrency(metrics.totalSpent, metrics.currency || 'USD')}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('seller.dashboard.lifetime_spend', 'Lifetime platform spend')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
