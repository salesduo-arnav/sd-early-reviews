import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import {
    ExternalLink,
    Eye,
    Upload,
    X,
    Clock,
    CheckCircle,
    Wallet,
    Star,
    AlertCircle,
    Loader2,
    Receipt,
    Globe,
} from 'lucide-react';
import { formatPrice, getAmazonProductUrl, REGION_DISPLAY_NAMES } from '@/lib/regions';
import { format } from 'date-fns';
import { buyerApi } from '@/api/buyer';
import type { BuyerClaim } from '@/api/buyer';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ClaimCardProps {
    claim: BuyerClaim;
    maxOrderRetries: number;
    maxReviewRetries: number;
    onViewDetails: (claim: BuyerClaim) => void;
    onUploadReview: (claim: BuyerClaim) => void;
    onCancelled: () => void;
    onRetry: (claim: BuyerClaim) => void;
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
    const { t } = useTranslation();
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                <Clock className="w-3 h-3" />
                {t('buyer.claims.deadline_label_expired', 'Expired')}
            </span>
        );
    }

    const colorClass = daysRemaining <= 3
        ? 'text-destructive'
        : daysRemaining <= 7
            ? 'text-amber-600'
            : 'text-green-600';

    return (
        <span className={cn('flex items-center gap-1 text-xs font-medium', colorClass)}>
            <Clock className="w-3 h-3" />
            {daysRemaining === 0
                ? t('buyer.claims.deadline_due_today', 'Due today')
                : t('buyer.claims.deadline_days_left', '{{count}} day left', { count: daysRemaining })
            }
        </span>
    );
}

/** Status-specific contextual message strip at the bottom of the card */
function StatusContextStrip({ claim, maxOrderRetries, maxReviewRetries }: { claim: BuyerClaim; maxOrderRetries: number; maxReviewRetries: number }) {
    const { t } = useTranslation();

    switch (claim.pipeline_status) {
        case 'ORDER_SUBMITTED':
            return (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('buyer.claims.status_msg_order_submitted', 'Your order is being verified')}</span>
                </div>
            );
        case 'REVIEW_PENDING':
            return (
                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-md">
                    <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('buyer.claims.status_msg_review_pending', 'Write your review and upload proof to get reimbursed')}</span>
                </div>
            );
        case 'REVIEW_SUBMITTED':
            return (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('buyer.claims.status_msg_review_submitted', 'Your review is being verified')}</span>
                </div>
            );
        case 'APPROVED':
            return (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('buyer.claims.status_msg_approved', 'Review approved! Payout is being processed')}</span>
                </div>
            );
        case 'REIMBURSED':
            return (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">
                    <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('buyer.claims.status_msg_reimbursed', "You've been reimbursed {{amount}}", { amount: formatPrice(Number(claim.expected_payout_amount), claim.region) })}</span>
                </div>
            );
        case 'REJECTED': {
            const isOrderRejected = claim.order_status === 'REJECTED';
            const retryCount = isOrderRejected ? claim.order_retry_count : claim.review_retry_count;
            const maxRetries = isOrderRejected ? maxOrderRetries : maxReviewRetries;
            const attemptsLeft = maxRetries - retryCount;

            return (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 px-3 py-1.5 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-clamp-1 flex-1">
                        {claim.rejection_reason || t('buyer.claims.status_msg_rejected', 'Your claim was rejected')}
                    </span>
                    {attemptsLeft > 0 && (
                        <span className="flex-shrink-0 text-[10px] font-medium bg-destructive/10 px-1.5 py-0.5 rounded">
                            {t('buyer.claims.attempts_left', '{{count}} attempt left', { count: attemptsLeft })}
                        </span>
                    )}
                </div>
            );
        }
        case 'TIMEOUT':
            return (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t('buyer.claims.status_msg_timeout', 'Review deadline has passed')}</span>
                </div>
            );
        default:
            return null;
    }
}

export function ClaimCard({ claim, maxOrderRetries, maxReviewRetries, onViewDetails, onUploadReview, onCancelled, onRetry }: ClaimCardProps) {
    const { t } = useTranslation();
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const showDeadline = claim.pipeline_status === 'REVIEW_PENDING' && claim.review_deadline;
    const showUploadAction = claim.pipeline_status === 'REVIEW_PENDING';
    const showCancelAction = claim.pipeline_status === 'ORDER_SUBMITTED';
    const isRejected = claim.pipeline_status === 'REJECTED';
    const isOrderRejected = claim.order_status === 'REJECTED';
    const retryCount = isOrderRejected ? claim.order_retry_count : claim.review_retry_count;
    const maxRetries = isOrderRejected ? maxOrderRetries : maxReviewRetries;
    const canRetry = isRejected && retryCount < maxRetries;

    const handleCancelConfirm = async () => {
        setIsCancelling(true);
        try {
            await buyerApi.cancelClaim(claim.id);
            toast.success(t('buyer.claims.claim_cancelled', 'Claim cancelled successfully.'));
            setCancelDialogOpen(false);
            onCancelled();
        } catch (err) {
            const message = getErrorMessage(err);
            toast.error(message);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <Card className="shadow-sm border-border hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-0">
                    {/* Main content */}
                    <div className="px-4 pt-4 pb-3 space-y-3">
                        {/* Top: Product info + Status */}
                        <div className="flex gap-3">
                            <a
                                href={getAmazonProductUrl(claim.region, claim.asin)}
                                target="_blank"
                                rel="noreferrer"
                                className="relative group flex-shrink-0"
                            >
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border">
                                    {claim.product_image_url ? (
                                        <img
                                            src={claim.product_image_url}
                                            alt={claim.product_title}
                                            className="w-full h-full object-contain p-1"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                            {t('common.no_image', 'No Img')}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                                </div>
                            </a>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium line-clamp-2 leading-snug">{claim.product_title}</p>
                                    <ClaimStatusBadge status={claim.pipeline_status} className="flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-xs text-muted-foreground font-mono">{claim.asin}</span>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <Globe className="w-3 h-3" />
                                        {REGION_DISPLAY_NAMES[claim.region] || claim.region}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 pt-2.5 border-t border-border/40">
                            <div className="flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-green-700">
                                    {formatPrice(Number(claim.expected_payout_amount), claim.region)}
                                </span>
                            </div>

                            
                            {/* Order ID */}
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Receipt className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground font-mono truncate" title={claim.amazon_order_id}>
                                    {claim.amazon_order_id}
                                </span>
                            </div>

                            {/* Deadline */}
                            {showDeadline && <DeadlineCountdown deadline={claim.review_deadline!} />}

                            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                                {format(new Date(claim.created_at), 'MMM d, yyyy')}
                            </span>
                        </div>

                        {/* Review stars */}
                        {claim.review_rating && (
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            'w-3 h-3',
                                            i < claim.review_rating!
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-200 fill-gray-200',
                                        )}
                                    />
                                ))}
                                <span className="text-[11px] text-muted-foreground ml-1">{t('buyer.claims.your_review_label', 'Your review')}</span>
                            </div>
                        )}

                        {/* Status context strip */}
                        <StatusContextStrip claim={claim} maxOrderRetries={maxOrderRetries} maxReviewRetries={maxReviewRetries} />
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-t border-border/50">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(claim)}
                            className="h-7 px-3 text-xs font-medium border-border/60 hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5"
                        >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            {t('common.view_details', 'Details')}
                        </Button>

                        {showUploadAction && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => onUploadReview(claim)}
                                className="h-7 px-3 text-xs font-medium"
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                {t('buyer.claims.upload_review', 'Submit Review')}
                            </Button>
                        )}

                        {showCancelAction && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelDialogOpen(true)}
                                className="h-7 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto text-xs font-medium"
                            >
                                <X className="w-3.5 h-3.5 mr-1" />
                                {t('common.cancel', 'Cancel')}
                            </Button>
                        )}
                        {canRetry && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => onRetry(claim)}
                                className="h-7 px-3 text-xs font-medium"
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                {t('buyer.claims.retry', 'Retry')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('buyer.claims.cancel_confirm_title', 'Cancel Claim?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('buyer.claims.cancel_confirm_desc', 'Are you sure you want to cancel your claim for "{{product}}"? This action cannot be undone.', { product: claim.product_title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            {t('common.keep', 'Keep Claim')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelConfirm}
                            disabled={isCancelling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    {t('buyer.claims.cancelling', 'Cancelling...')}
                                </>
                            ) : (
                                t('buyer.claims.confirm_cancel', 'Yes, Cancel Claim')
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
