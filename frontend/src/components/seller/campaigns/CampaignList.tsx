import React from 'react';
import { useTranslation } from 'react-i18next';
import { Campaign } from '@/api/campaigns';
import { CampaignCard } from './CampaignCard';
import { Loader2 } from 'lucide-react';

interface CampaignListProps {
    campaigns: Campaign[];
    isLoading: boolean;
    error: string | null;
}

export function CampaignList({ campaigns, isLoading, error }: CampaignListProps) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
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

    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const pausedCampaigns = campaigns.filter(c => c.status === 'paused');
    const completedCampaigns = campaigns.filter(c => c.status === 'completed');

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
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
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
