import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClaimStatusBadgeProps {
    status: string;
    className?: string;
}

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
    const { t } = useTranslation();

    switch (status) {
        case 'ORDER_SUBMITTED':
            return <Badge variant="outline" className={cn('bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200', className)}>{t('buyer.claims.status.order_submitted', 'Order Submitted')}</Badge>;
        case 'REVIEW_PENDING':
            return <Badge variant="outline" className={cn('bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200', className)}>{t('buyer.claims.status.review_pending', 'Review Pending')}</Badge>;
        case 'REVIEW_SUBMITTED':
            return <Badge variant="outline" className={cn('bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200', className)}>{t('buyer.claims.status.under_review', 'Under Review')}</Badge>;
        case 'APPROVED':
            return <Badge variant="outline" className={cn('bg-green-50 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200', className)}>{t('buyer.claims.status.approved', 'Approved')}</Badge>;
        case 'REIMBURSED':
            return <Badge variant="outline" className={cn('bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200', className)}>{t('buyer.claims.status.reimbursed', 'Reimbursed')}</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive" className={className}>{t('buyer.claims.status.rejected', 'Rejected')}</Badge>;
        case 'TIMEOUT':
            return <Badge variant="outline" className={cn('text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-50 hover:text-gray-500 hover:border-gray-200', className)}>{t('buyer.claims.status.timed_out', 'Timed Out')}</Badge>;
        default:
            return <Badge variant="outline" className={className}>{status}</Badge>;
    }
}
