import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export default function SellerDashboard() {
    const { t } = useTranslation();

    const navLinks = [
        { label: t('seller.my_campaigns', 'My Campaigns'), href: '/seller/campaigns' },
        { label: t('seller.create_campaign', 'Create Campaign'), href: '/seller/campaigns/create' },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <DashboardNavbar links={navLinks} />
            <main className="container max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('seller.welcome_title', 'Welcome, Seller!')}</h1>
                        <p className="text-muted-foreground mt-2">{t('seller.welcome_subtitle', 'Manage your campaigns and track incoming reviews.')}</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Placeholder content */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold leading-none tracking-tight mb-2">{t('seller.my_campaigns', 'My Campaigns')}</h3>
                            <p className="text-sm text-muted-foreground">{t('seller.my_campaigns_desc', 'View your active product promotions.')}</p>
                        </div>
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold leading-none tracking-tight mb-2">{t('seller.create_campaign', 'Create Campaign')}</h3>
                            <p className="text-sm text-muted-foreground">{t('seller.create_campaign_desc', 'Launch a new product review campaign.')}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
