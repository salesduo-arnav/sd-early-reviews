import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertTriangle, Landmark } from 'lucide-react';
import { buyerApi } from '@/api/buyer';

export function BuyerLayout() {
    const { t } = useTranslation();
    const [isBlacklisted, setIsBlacklisted] = useState(false);
    const [blacklistReason, setBlacklistReason] = useState<string | null>(null);
    const [needsBankAccount, setNeedsBankAccount] = useState(false);

    useEffect(() => {
        buyerApi.getAccountProfile().then((profile) => {
            setIsBlacklisted(profile.is_blacklisted);
            setBlacklistReason(profile.blacklist_reason);
            setNeedsBankAccount(!profile.wise_connected && !profile.is_blacklisted);
        }).catch(() => {
            // Silently fail — profile page will show its own error
        });
    }, []);

    const navLinks = [
        { label: t('buyer.nav.marketplace', 'Marketplace'), href: '/buyer/marketplace' },
        { label: t('buyer.nav.my_claims', 'My Claims'), href: '/buyer/claims' },
        { label: t('buyer.nav.account', 'Profile & Earnings'), href: '/buyer/account' },
    ];

    const hasBanner = isBlacklisted || needsBankAccount;

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
            {needsBankAccount && !isBlacklisted && (
                <div className={`fixed ${isBlacklisted ? 'top-32' : 'top-16'} left-0 right-0 z-40 bg-amber-50 border-b border-amber-200`}>
                    <div className="w-full px-4 md:px-8 py-3 flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-amber-600 shrink-0" />
                        <div className="text-sm flex-1">
                            <p className="font-semibold text-amber-800">
                                {t('buyer.bank_banner.title', 'Bank account not connected')}
                            </p>
                            <p className="text-amber-700 mt-0.5">
                                {t('buyer.bank_banner.description', 'Add your bank account to receive reimbursements for your reviews.')}
                            </p>
                        </div>
                        <Link to="/buyer/account">
                            <button className="text-sm font-medium text-amber-800 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap">
                                {t('buyer.bank_banner.action', 'Connect now')}
                            </button>
                        </Link>
                    </div>
                </div>
            )}
            <main className={`w-full px-4 md:px-8 pt-24 pb-12 ${hasBanner ? 'mt-14' : ''}`}>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
}
