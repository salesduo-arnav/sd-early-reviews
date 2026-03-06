import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export function BuyerLayout() {
    const { t } = useTranslation();

    const navLinks = [
        { label: t('buyer.nav.marketplace', 'Marketplace'), href: '/buyer/marketplace' },
        { label: t('buyer.nav.my_claims', 'My Claims'), href: '/buyer/claims' },
        { label: t('buyer.nav.account', 'Profile & Earnings'), href: '/buyer/account' },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <DashboardNavbar links={navLinks} />
            <main className="w-full px-4 md:px-8 pt-24 pb-12">
                <Outlet />
            </main>
        </div>
    );
}
