import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi, CampaignProgress } from '@/api/dashboard/seller';
import { Badge } from '@/components/ui/badge';

export function CampaignProgressCards() {
    const { t } = useTranslation();
    const [campaigns, setCampaigns] = useState<CampaignProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const data = await dashboardApi.getSellerCampaignProgress();
                setCampaigns(data);
            } catch (err: unknown) {
                console.error('Failed to fetch campaign progress', err);
                setError('Failed to load campaign progress.');
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-sm border-border animate-pulse h-[200px]" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4 col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold tracking-tight">{t('seller.dashboard.campaign_progress', 'Campaign Progress')}</h2>
                <Card className="shadow-sm border-border w-full py-8 text-center flex items-center justify-center min-h-[200px]">
                    <CardContent className="pt-6">
                        <p className="text-destructive font-medium">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="space-y-4 col-span-1 md:col-span-2">
                <h2 className="text-xl font-semibold tracking-tight">{t('seller.dashboard.campaign_progress', 'Campaign Progress')}</h2>
                <Card className="shadow-sm border-border w-full py-8 text-center flex items-center justify-center min-h-[200px]">
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">{t('seller.dashboard.no_active_campaigns', 'No active campaigns found. Create one to see progress here.')}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 col-span-1 md:col-span-2">
            <h2 className="text-xl font-semibold tracking-tight">{t('seller.dashboard.campaign_progress', 'Campaign Progress')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => {
                    const targetDivisor = campaign.target > 0 ? campaign.target : 1;
                    const progress = Math.min((campaign.completed / targetDivisor) * 100, 100);
                    const isCompleted = campaign.completed >= campaign.target && campaign.target > 0;

                    return (
                        <Card key={campaign.id} className="shadow-sm border-border flex flex-col justify-between">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-3 items-center w-full">
                                        <div className="h-10 w-10 flex-shrink-0 rounded bg-muted overflow-hidden border border-border">
                                            {campaign.image ? (
                                                <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-secondary/50" />
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <CardTitle className="text-base font-semibold truncate" title={campaign.title}>
                                                {campaign.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs truncate uppercase tracking-wider">
                                                {campaign.status}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('seller.dashboard.reviews_completed', 'Reviews Completed')}</span>
                                        <span className="font-medium">{campaign.completed} / {campaign.target}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-in-out ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-brand-secondary to-brand-primary'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    {isCompleted && (
                                        <Badge variant="outline" className="mt-2 text-green-500 border-green-500/20 bg-green-500/10">
                                            {t('seller.dashboard.goal_reached', 'Goal Reached')}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
