import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export default function AdminDashboard() {
    const { t } = useTranslation();

    const navLinks = [
        { label: 'Overview', href: '/admin/overview' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Campaigns', href: '/admin/campaigns' },
        { label: 'Reimbursements', href: '/admin/reimbursements' },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <DashboardNavbar links={navLinks} />
            <main className="container max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Manage platform users, verify campaigns, and oversee reimbursements.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
