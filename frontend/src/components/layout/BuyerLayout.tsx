import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { AlertTriangle } from 'lucide-react';
import { buyerApi } from '@/api/buyer';

export function BuyerLayout() {
    const { t } = useTranslation();
    const [isBlacklisted, setIsBlacklisted] = useState(false);
    const [blacklistReason, setBlacklistReason] = useState<string | null>(null);

    useEffect(() => {
        buyerApi.getAccountProfile().then((profile) => {
            setIsBlacklisted(profile.is_blacklisted);
            setBlacklistReason(profile.blacklist_reason);
        }).catch(() => {
            // Silently fail — profile page will show its own error
        });
    }, []);

    const navLinks = [
        { label: t('buyer.nav.marketplace', 'Marketplace'), href: '/buyer/marketplace' },
        { label: t('buyer.nav.my_claims', 'My Claims'), href: '/buyer/claims' },
        { label: t('buyer.nav.account', 'Profile & Earnings'), href: '/buyer/account' },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <DashboardNavbar links={navLinks} />
            {isBlacklisted && (
                <div className="fixed top-16 left-0 right-0 z-40 bg-destructive/10 border-b border-destructive/20">
                    <div className="w-full px-4 md:px-8 py-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-destructive">
                                {t('buyer.blacklist.title', 'Your account has been restricted')}
                            </p>
                            <p className="text-destructive/80 mt-0.5">
                                {t('buyer.blacklist.description', 'You are unable to claim new products or submit reviews. Existing approved payouts will still be processed.')}
                                {blacklistReason && (
                                    <span className="block mt-1">
                                        {t('buyer.blacklist.reason', 'Reason:')} {blacklistReason}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <main className={`w-full px-4 md:px-8 pt-24 pb-12 ${isBlacklisted ? 'mt-20' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
}
