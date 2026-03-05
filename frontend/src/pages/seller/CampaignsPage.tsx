import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { campaignsApi, Campaign } from '@/api/campaigns';
import { CampaignList } from '@/components/seller/campaigns/CampaignList';
import { CampaignWizardModal } from '@/components/seller/campaigns/wizard/CampaignWizardModal';
import { toast } from 'sonner';

export default function CampaignsPage() {
    const { t } = useTranslation();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCampaigns = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await campaignsApi.getCampaigns();
            setCampaigns(data);
        } catch (err) {
            console.error('Failed to load campaigns', err);
            setError(t('seller.campaigns.fetch_error', 'Failed to load campaigns.') as string);
            toast.error(t('seller.campaigns.fetch_error', 'Failed to load campaigns.'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadCampaigns();
    }, [loadCampaigns]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('seller.nav.campaigns', 'Campaigns')}</h1>
                    <p className="text-muted-foreground mt-2">{t('seller.campaigns_page_desc', 'Manage all your active and past product campaigns.')}</p>
                </div>
                <Button
                    onClick={() => setIsWizardOpen(true)}
                    size="lg"
                    className="font-semibold shadow-sm w-full sm:w-auto hover:scale-[1.02] transition-transform"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('seller.campaigns.create_btn', 'Create Campaign')}
                </Button>
            </div>

            <CampaignList
                campaigns={campaigns}
                isLoading={isLoading}
                error={error}
            />

            <CampaignWizardModal
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                onSuccess={loadCampaigns}
            />
        </div>
    );
}
