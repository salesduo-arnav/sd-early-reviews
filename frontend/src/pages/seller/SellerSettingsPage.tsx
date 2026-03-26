import React from 'react';
import { useTranslation } from 'react-i18next';
import SpApiConnect from '@/components/seller/SpApiConnect';
import { PageMeta } from '@/components/PageMeta';

const SellerSettingsPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full mx-auto space-y-8">
            <PageMeta title="Settings" description="Manage your Amazon SP-API integration, account preferences, and seller settings on SalesDuo." />
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {t('seller.settings.title', 'Settings')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {t('seller.settings.subtitle', 'Manage your integrations and account preferences.')}
                </p>
            </div>

            <section className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold">{t('seller.settings.integrations', 'Integrations')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('seller.settings.integrations_desc', 'Connect external services to enhance your workflow.')}
                    </p>
                </div>
                <SpApiConnect />
            </section>
        </div>
    );
};

export default SellerSettingsPage;
