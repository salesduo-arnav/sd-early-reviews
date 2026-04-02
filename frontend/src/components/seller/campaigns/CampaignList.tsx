import React from 'react';
import { useTranslation } from 'react-i18next';
import { Campaign } from '@/api/campaigns';
import { CampaignCard } from './CampaignCard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignListProps {
    campaigns: Campaign[];
    isLoading: boolean;
    error: string | null;
}

export function CampaignList({ campaigns, isLoading, error }: CampaignListProps) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="space-y-10">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="shadow-sm border-border flex flex-col justify-between">
                                <CardHeader className="pb-2">
                                    <div className="flex gap-4 items-center">
                                        <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-full" />
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-2 space-y-3">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                        <Skeleton className="h-2.5 w-full rounded-full" />
                                        <div className="flex justify-between pt-2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-destructive">
                {error}
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground bg-card rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-lg font-medium">{t('seller.campaigns.no_campaigns.title', 'No campaigns found')}</p>
                <p className="mt-2">{t('seller.campaigns.no_campaigns.desc', 'Get started by creating your first campaign.')}</p>
            </div>
        );
    }

    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
    const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED');
    const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED');

    const renderGrid = (items: Campaign[]) => (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
        </div>
    );

    return (
        <div className="space-y-10">
            {activeCampaigns.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                        {t('seller.campaigns.section.active', 'Active Campaigns')}
                    </h2>
                    {renderGrid(activeCampaigns)}
                </section>
            )}

            {pausedCampaigns.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-gray-500/40" />
                        {t('seller.campaigns.section.paused', 'Paused Campaigns')}
                    </h2>
                    {renderGrid(pausedCampaigns)}
                </section>
            )}

            {completedCampaigns.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {t('seller.campaigns.section.completed', 'Completed Campaigns')}
                    </h2>
                    {renderGrid(completedCampaigns)}
                </section>
            )}
        </div>
    );
}
