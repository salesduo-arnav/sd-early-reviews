import { useTranslation } from 'react-i18next';
import { BillingSummaryCards } from '@/components/seller/billing/BillingSummaryCards';
import { BillingHistoryTable } from '@/components/seller/billing/BillingHistoryTable';

export default function BillingPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('seller.nav.billing', 'Billing')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('seller.billing_page_desc', 'View your payment history and download invoices.')}
                </p>
            </div>

            <BillingSummaryCards />

            <div>
                <h2 className="text-xl font-semibold mb-4">
                    {t('seller.billing.history', 'Transaction History')}
                </h2>
                <BillingHistoryTable />
            </div>
        </div>
    );
}
