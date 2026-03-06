import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, ClipboardCheck, TrendingUp } from 'lucide-react';

export default function AccountPage() {
    const { t } = useTranslation();

    const statCards = [
        {
            icon: ShoppingBag,
            title: t('buyer.account.active_claims', 'Active Claims'),
            desc: t('buyer.account.active_claims_desc', 'Currently in progress'),
            placeholder: '—',
        },
        {
            icon: ClipboardCheck,
            title: t('buyer.account.reviews_submitted', 'Reviews Submitted'),
            desc: t('buyer.account.reviews_submitted_desc', 'Total lifetime'),
            placeholder: '—',
        },
        {
            icon: DollarSign,
            title: t('buyer.account.total_earnings', 'Total Earnings'),
            desc: t('buyer.account.total_earnings_desc', 'Reimbursements received'),
            placeholder: '—',
        },
        {
            icon: TrendingUp,
            title: t('buyer.account.approval_rate', 'Approval Rate'),
            desc: t('buyer.account.approval_rate_desc', 'Reviews approved'),
            placeholder: '—',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('buyer.account.title', 'Profile & Earnings')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('buyer.account.subtitle', 'Track your performance, manage bank details, and view your earnings.')}
                </p>
            </div>

            {/* Quick stat cards — values will be wired to API later */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <Card key={card.title} className="shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.placeholder}</div>
                            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Planned features */}
            <Card className="shadow-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t('buyer.account.features_title', 'Planned Features')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>{t('buyer.account.feature_health', 'Profile health stats: on-time submission rate, total earnings, claims completed, approval rate')}</li>
                        <li>{t('buyer.account.feature_amazon_url', 'Read-only Amazon Profile URL display')}</li>
                        <li>{t('buyer.account.feature_bank', 'Bank details management: add, edit, or remove bank account for reimbursements')}</li>
                        <li>{t('buyer.account.feature_notifications', 'Notification preferences (email toggle)')}</li>
                        <li>{t('buyer.account.feature_tier', 'Buyer tier / reputation badge display')}</li>
                        <li>{t('buyer.account.feature_activity', 'Account activity log (last login, recent actions)')}</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
