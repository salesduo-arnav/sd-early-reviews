import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export function SellerLayout() {
    const { t } = useTranslation();

    const navLinks = [
        { label: t('seller.nav.dashboard', 'Dashboard'), href: '/seller/dashboard' },
        { label: t('seller.nav.campaigns', 'Campaigns'), href: '/seller/campaigns' },
        { label: t('seller.nav.reviews', 'Reviews'), href: '/seller/reviews' },
        { label: t('seller.nav.billing', 'Billing'), href: '/seller/billing' },
        { label: t('seller.nav.settings', 'Settings'), href: '/seller/settings' },
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
