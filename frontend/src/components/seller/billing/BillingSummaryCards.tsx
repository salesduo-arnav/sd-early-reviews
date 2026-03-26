import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt, Clock } from 'lucide-react';
import { billingApi, BillingSummary } from '@/api/billing';
import { formatPriceByCurrency } from '@/lib/regions';

export function BillingSummaryCards() {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        billingApi.getSummary()
            .then((data) => { if (!cancelled) setSummary(data); })
            .catch(() => { if (!cancelled) setError('Failed to load billing data.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="shadow-sm border-border animate-pulse h-[120px]" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-4 mb-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    if (!summary) return null;

    const cards = [
        {
            label: t('seller.billing.total_spent', 'Total Spent'),
            value: formatPriceByCurrency(summary.totalSpent, summary.currency),
            sub: t('seller.billing.lifetime_charges', 'Lifetime campaign charges'),
            icon: <DollarSign className="w-4 h-4 text-brand-primary" />,
        },
        {
            label: t('seller.billing.transactions', 'Transactions'),
            value: summary.totalTransactions,
            sub: t('seller.billing.total_charges', 'Total charges made'),
            icon: <Receipt className="w-4 h-4 text-brand-primary" />,
        },
        {
            label: t('seller.billing.pending', 'Pending'),
            value: formatPriceByCurrency(summary.pendingAmount, summary.currency),
            sub: t('seller.billing.awaiting_processing', 'Awaiting processing'),
            icon: <Clock className="w-4 h-4 text-orange-500" />,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
                <Card key={card.label} className="shadow-sm border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
