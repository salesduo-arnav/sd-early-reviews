import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewStatsCards } from '@/components/seller/reviews/ReviewStatsCards';
import { ReviewsTable } from '@/components/seller/reviews/ReviewsTable';

export default function ReviewsPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('seller.nav.reviews', 'Reviews')}</h1>
                <p className="text-muted-foreground mt-2">{t('seller.reviews_page_desc', 'Monitor and verify incoming reviews from buyers.')}</p>
            </div>

            <ReviewStatsCards />

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-4">{t('seller.reviews.all_reviews', 'All Reviews')}</h2>
                <ReviewsTable />
            </div>
        </div>
    );
}
