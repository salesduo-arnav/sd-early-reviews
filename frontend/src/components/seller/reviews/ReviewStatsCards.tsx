import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, CheckCircle, Clock, Star } from 'lucide-react';
import { dashboardApi, SellerReviewStats } from '@/api/seller';
import { getErrorMessage } from '@/lib/errors';

export function ReviewStatsCards() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<SellerReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardApi.getSellerReviewStats();
                setStats(data);
            } catch (err: unknown) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-14 mb-2" />
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

    if (!stats) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.reviews.total_reviews', 'Total Reviews')}
                    </CardTitle>
                    <MessageSquare className="w-4 h-4 text-brand-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalReviews}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('seller.reviews.acc_all_campaigns', 'Across all campaigns')}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.reviews.average_rating', 'Average Rating')}
                    </CardTitle>
                    <Star className="w-4 h-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.averageRating}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('seller.reviews.out_of_5', 'Out of 5 stars')}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.reviews.approved', 'Approved')}
                    </CardTitle>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.approvedReviews}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('seller.reviews.verified_by_team', 'Verified by team')}
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">
                        {t('seller.reviews.pending', 'Pending Verification')}
                    </CardTitle>
                    <Clock className="w-4 h-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('seller.reviews.awaiting_verification', 'Awaiting verification')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
