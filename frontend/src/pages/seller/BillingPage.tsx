import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

export default function BillingPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('seller.nav.billing', 'Billing')}</h1>
                <p className="text-muted-foreground mt-2">{t('seller.billing_page_desc', 'Manage your payment methods and view past transactions.')}</p>
            </div>
            <Card className="shadow-sm border-border flex items-center justify-center min-h-[400px]">
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">{t('seller.coming_soon', 'This section is under construction.')}</p>
                </CardContent>
            </Card>
        </div>
    );
}
