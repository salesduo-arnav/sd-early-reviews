import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MarketplacePage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('buyer.marketplace.title', 'Marketplace')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('buyer.marketplace.subtitle', 'Browse available products, claim deals, and start earning reimbursements.')}
                </p>
            </div>

            <Card className="shadow-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t('buyer.marketplace.features_title', 'Planned Features')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>{t('buyer.marketplace.feature_browse', 'Browse available products from active seller campaigns')}</li>
                        <li>{t('buyer.marketplace.feature_filter', 'Filter by category, region, reimbursement %, and price range')}</li>
                        <li>{t('buyer.marketplace.feature_sort', 'Sort by newest, highest reimbursement, or most popular')}</li>
                        <li>{t('buyer.marketplace.feature_product_card', 'Product detail card with image, title, price, reimbursement amount, and seller rating')}</li>
                        <li>{t('buyer.marketplace.feature_amazon_link', '"View on Amazon" external link for each product')}</li>
                        <li>{t('buyer.marketplace.feature_claim_cta', '"Claim Product" CTA button → opens modal to upload order screenshot as proof')}</li>
                        <li>{t('buyer.marketplace.feature_search', 'Search bar for keyword or ASIN search')}</li>
                        <li>{t('buyer.marketplace.feature_pagination', 'Paginated product listing')}</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
