import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, DollarSign, ClipboardCheck, TrendingUp } from 'lucide-react';
import type { BuyerProfile } from '@/api/buyer';

interface ProfileStatsSectionProps {
    profile: BuyerProfile | null;
    loading: boolean;
}

export default function ProfileStatsSection({ profile, loading }: ProfileStatsSectionProps) {
    const { t } = useTranslation();

    const stats = [
        {
            icon: Clock,
            title: t('buyer.account.stats.on_time_rate', 'On-time Rate'),
            value: profile ? `${profile.on_time_rate}%` : '—',
            desc: t('buyer.account.stats.on_time_rate_desc', 'Submission punctuality'),
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-50',
        },
        {
            icon: DollarSign,
            title: t('buyer.account.stats.total_earnings', 'Total Earnings'),
            value: profile ? `$${profile.total_earnings.toFixed(2)}` : '—',
            desc: t('buyer.account.stats.total_earnings_desc', 'Reimbursements received'),
            iconColor: 'text-green-600',
            iconBg: 'bg-green-50',
        },
        {
            icon: ClipboardCheck,
            title: t('buyer.account.stats.claims_completed', 'Claims Completed'),
            value: profile ? String(profile.claims_completed) : '—',
            desc: t('buyer.account.stats.claims_completed_desc', 'Payouts processed'),
            iconColor: 'text-brand-primary',
            iconBg: 'bg-brand-primary/10',
        },
        {
            icon: TrendingUp,
            title: t('buyer.account.stats.approval_rate', 'Approval Rate'),
            value: profile
                ? (profile.approval_rate !== null ? `${profile.approval_rate}%` : t('buyer.account.stats.na', 'N/A'))
                : '—',
            desc: t('buyer.account.stats.approval_rate_desc', 'Reviews approved'),
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-50',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title} className="shadow-sm border-border hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stat.value}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
