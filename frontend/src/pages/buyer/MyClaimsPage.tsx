import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyClaimsPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('buyer.claims.title', 'My Claims')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('buyer.claims.subtitle', 'Track your claimed products, upload review proof, and monitor reimbursement status.')}
                </p>
            </div>

            <Card className="shadow-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t('buyer.claims.features_title', 'Planned Features')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>{t('buyer.claims.feature_list', 'Table / cards listing all claims with full status pipeline (Order Submitted → Review Pending → Review Submitted → Approved → Reimbursed)')}</li>
                        <li>{t('buyer.claims.feature_status_filter', 'Status filter tabs or dropdown to narrow results')}</li>
                        <li>{t('buyer.claims.feature_upload_review', 'Upload review proof (review URL or screenshot)')}</li>
                        <li>{t('buyer.claims.feature_timeline', 'Claim detail expansion with timeline / activity log')}</li>
                        <li>{t('buyer.claims.feature_deadline', 'Deadline countdown for review submission')}</li>
                        <li>{t('buyer.claims.feature_payout', 'Reimbursement amount and payout status per claim')}</li>
                        <li>{t('buyer.claims.feature_amazon_link', 'Direct link to the product on Amazon')}</li>
                        <li>{t('buyer.claims.feature_cancel', 'Cancel claim action (if still in early stages)')}</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
