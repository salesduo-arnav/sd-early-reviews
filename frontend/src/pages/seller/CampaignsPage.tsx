import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export default function CampaignsPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('seller.nav.campaigns', 'Campaigns')}</h1>
                <p className="text-muted-foreground mt-2">{t('seller.campaigns_page_desc', 'Manage all your active and past product campaigns.')}</p>
            </div>
            <Card className="shadow-sm border-border flex items-center justify-center min-h-[400px]">
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">{t('seller.coming_soon', 'This section is under construction.')}</p>
                </CardContent>
            </Card>
        </div>
    );
}
