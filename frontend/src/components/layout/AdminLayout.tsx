import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export function AdminLayout() {
    const navLinks = [
        { label: 'Overview', href: '/admin/overview' },
        { label: 'Verifications', href: '/admin/verifications' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Campaigns', href: '/admin/campaigns' },
        { label: 'Payouts', href: '/admin/payouts' },
        { label: 'Settings', href: '/admin/settings' },
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
