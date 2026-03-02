import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export default function BuyerDashboard() {
    const { t } = useTranslation();

    const navLinks = [
        { label: t('buyer.available_campaigns', 'Available Campaigns'), href: '/buyer/campaigns' },
        { label: t('buyer.my_claims', 'My Claims'), href: '/buyer/claims' },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <DashboardNavbar links={navLinks} />
            <main className="container max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('buyer.welcome_title', 'Welcome, Buyer!')}</h1>
                        <p className="text-muted-foreground mt-2">{t('buyer.welcome_subtitle', 'Here you can browse available products to review and earn reimbursements.')}</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Placeholder content */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold leading-none tracking-tight mb-2">{t('buyer.available_campaigns', 'Available Campaigns')}</h3>
                            <p className="text-sm text-muted-foreground">{t('buyer.available_campaigns_desc', 'Find products to review.')}</p>
                        </div>
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="font-semibold leading-none tracking-tight mb-2">{t('buyer.my_claims', 'My Claims')}</h3>
                            <p className="text-sm text-muted-foreground">{t('buyer.my_claims_desc', 'Track your ongoing review reimbursements.')}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
