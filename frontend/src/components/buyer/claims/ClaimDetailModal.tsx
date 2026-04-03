import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { ClaimStatusPipeline } from './ClaimStatusPipeline';
import { SubmitReviewForm } from './SubmitReviewForm';
import {
    ExternalLink,
    Receipt,
    Clock,
    Star,
    AlertCircle,
    X,
    Calendar as CalendarIcon,
    Wallet,
    Image as ImageIcon,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, formatDistanceToNow } from 'date-fns';
import { formatPrice, getAmazonProductUrl } from '@/lib/regions';
import { buyerApi } from '@/api/buyer';
import type { BuyerClaim } from '@/api/buyer';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ClaimDetailModalProps {
    claim: BuyerClaim | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReviewSubmitted: () => void;
    onClaimCancelled: () => void;
    maxOrderRetries: number;
    maxReviewRetries: number;
}

export function ClaimDetailModal({ claim, open, onOpenChange, onReviewSubmitted, onClaimCancelled, maxOrderRetries, maxReviewRetries }: ClaimDetailModalProps) {
    const { t } = useTranslation();
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryOrderId, setRetryOrderId] = useState('');
    const [retrySelectedDate, setRetrySelectedDate] = useState<Date | undefined>();
    const [retryDatePickerOpen, setRetryDatePickerOpen] = useState(false);
    const [retryProofFile, setRetryProofFile] = useState<File | null>(null);

    // Reset retry form state when opening a different claim or reopening the modal
    const claimId = claim?.id;
    const claimOrderId = claim?.amazon_order_id;
    React.useEffect(() => {
        if (claimId) {
            setRetryOrderId(claimOrderId ?? '');
            setRetrySelectedDate(undefined);
            setRetryProofFile(null);
            setIsRetrying(false);
        }
    }, [claimId, claimOrderId]);

    if (!claim) return null;

    const isReviewPending = claim.pipeline_status === 'REVIEW_PENDING';
    const hasReview = claim.review_text || claim.review_rating;
    const isRejected = claim.pipeline_status === 'REJECTED';
    const canCancel = claim.pipeline_status === 'ORDER_SUBMITTED';
    const isOrderRejected = claim.order_status === 'REJECTED';
    const isReviewRejected = claim.review_status === 'REJECTED' && claim.order_status !== 'REJECTED';
    const orderAttemptsLeft = maxOrderRetries - (claim.order_retry_count ?? 0);
    const reviewAttemptsLeft = maxReviewRetries - (claim.review_retry_count ?? 0);
    const canRetryOrder = isOrderRejected && orderAttemptsLeft > 0;
    const canRetryReview = isReviewRejected && reviewAttemptsLeft > 0;

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await buyerApi.cancelClaim(claim.id);
            toast.success(t('buyer.claims.claim_cancelled', 'Claim cancelled successfully.'));
            setCancelDialogOpen(false);
            onOpenChange(false);
            onClaimCancelled();
        } catch (err) {
            const message = getErrorMessage(err);
            toast.error(message);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReviewSuccess = () => {
        onOpenChange(false);
        onReviewSubmitted();
    };

    const handleRetryOrder = async () => {
        if (!retryOrderId.trim() || !retryProofFile || !retrySelectedDate) {
            toast.error(t('buyer.claims.retry_fill_fields', 'Please fill in all fields.'));
            return;
        }
        setIsRetrying(true);
        try {
            const { url } = await buyerApi.uploadImage(retryProofFile);
            await buyerApi.retryOrder(claim.id, {
                amazon_order_id: retryOrderId.trim(),
                order_proof_url: url,
                purchase_date: format(retrySelectedDate, 'yyyy-MM-dd'),
            });
            toast.success(t('buyer.claims.order_retry_success', 'Order proof resubmitted successfully.'));
            onOpenChange(false);
            onReviewSubmitted();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsRetrying(false);
        }
    };

    // Deadline info
    const deadlineInfo = claim.review_deadline ? (() => {
        const deadline = new Date(claim.review_deadline);
        const now = new Date();
        const isExpired = deadline < now;
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { deadline, isExpired, daysLeft, formatted: format(deadline, 'MMM d, yyyy') };
    })() : null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-start pr-4">
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {t('buyer.claims.claim_details', 'Claim Details')}
                                    <ClaimStatusBadge status={claim.pipeline_status} />
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    {t('buyer.claims.claimed_on', 'Claimed on {{date}}', { date: format(new Date(claim.created_at), 'MMMM d, yyyy') })}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        {/* Product & Order Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                            <div className="flex gap-3">
                                <div className="w-16 h-16 rounded overflow-hidden bg-background border shrink-0">
                                    {claim.product_image_url ? (
                                        <img src={claim.product_image_url} alt={claim.product_title} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted text-xs">
                                            {t('common.no_image', 'No Img')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                    <p className="text-sm font-medium line-clamp-2 leading-tight">{claim.product_title}</p>
                                    <a
                                        href={getAmazonProductUrl(claim.region, claim.asin)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium text-sm text-brand-primary hover:underline flex items-center gap-1 mt-1"
                                    >
                                        {claim.asin} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center border-l md:pl-4 pl-0 border-t md:border-t-0 pt-4 md:pt-0">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                            <Receipt className="w-3 h-3" /> {t('common.order_id', 'Order ID')}
                                        </span>
                                        <div className="font-medium text-sm mt-0.5 font-mono">{claim.amazon_order_id}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                            <Wallet className="w-3 h-3" /> {t('common.payout', 'Payout')}
                                        </span>
                                        <div className="font-medium text-sm mt-0.5 text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded border border-green-200">
                                            {formatPrice(Number(claim.expected_payout_amount), claim.region)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Pipeline */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                {t('buyer.claims.progress', 'Progress')}
                            </h4>
                            <div className="bg-background border rounded-lg p-4">
                                <ClaimStatusPipeline pipelineStatus={claim.pipeline_status} />
                            </div>
                        </div>

                        {/* Deadline Section */}
                        {isReviewPending && deadlineInfo && (
                            <div className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border',
                                deadlineInfo.isExpired
                                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                    : deadlineInfo.daysLeft <= 3
                                        ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                        : deadlineInfo.daysLeft <= 7
                                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                                            : 'bg-blue-50 border-blue-200 text-blue-700',
                            )}>
                                <Clock className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {deadlineInfo.isExpired
                                            ? t('buyer.claims.deadline_expired', 'Review deadline has expired')
                                            : t('buyer.claims.deadline_remaining', 'Review deadline: {{date}}', { date: deadlineInfo.formatted })
                                        }
                                    </p>
                                    {!deadlineInfo.isExpired && (
                                        <p className="text-xs mt-0.5 opacity-80">
                                            {formatDistanceToNow(deadlineInfo.deadline, { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Seller Guidelines */}
                        {isReviewPending && claim.guidelines && (
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                    {t('buyer.claims.seller_guidelines', 'Seller Guidelines')}
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 whitespace-pre-line">
                                    {claim.guidelines}
                                </p>
                            </div>
                        )}

                        {/* Review Upload Form (when review is pending) */}
                        {isReviewPending && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    {t('buyer.claims.submit_your_review', 'Submit Your Review')}
                                </h4>
                                <div className="bg-background border rounded-lg p-4">
                                    <SubmitReviewForm claimId={claim.id} onSuccess={handleReviewSuccess} />
                                </div>
                            </div>
                        )}

                        {/* Existing Review Display */}
                        {hasReview && !isReviewPending && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    {t('buyer.claims.your_review', 'Your Review')}
                                </h4>
                                <div className="bg-background border rounded-lg p-4 space-y-3">
                                    {claim.review_rating && (
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        'w-5 h-5',
                                                        i < claim.review_rating!
                                                            ? 'text-yellow-500 fill-yellow-500'
                                                            : 'text-gray-200 fill-gray-200',
                                                    )}
                                                />
                                            ))}
                                            <span className="ml-2 font-medium text-sm">
                                                {t('buyer.claims.rating_out_of', '{{rating}} out of 5', { rating: claim.review_rating })}
                                            </span>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="text-sm">
                                        {claim.review_text ? (
                                            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{claim.review_text}</p>
                                        ) : (
                                            <p className="italic text-muted-foreground">{t('buyer.claims.no_review_text', 'No review text.')}</p>
                                        )}
                                    </div>

                                    {claim.review_date && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CalendarIcon className="w-3 h-3" />
                                            {t('buyer.claims.submitted_on', 'Submitted {{date}}', { date: format(new Date(claim.review_date), 'MMM d, yyyy') })}
                                        </div>
                                    )}

                                    {claim.review_proof_url && (
                                        <div className="flex items-center gap-1 text-xs">
                                            <ImageIcon className="w-3 h-3 text-muted-foreground" />
                                            <a
                                                href={claim.review_proof_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-brand-primary hover:underline"
                                            >
                                                {t('buyer.claims.view_screenshot', 'View Screenshot')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payout Status (for approved/reimbursed claims) */}
                        {(claim.pipeline_status === 'APPROVED' || claim.pipeline_status === 'REIMBURSED') && (
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                                <Wallet className="w-5 h-5 text-green-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-green-700">
                                        {claim.pipeline_status === 'REIMBURSED'
                                            ? t('buyer.claims.payout_processed', 'Payout of {{amount}} has been processed', { amount: formatPrice(Number(claim.expected_payout_amount), claim.region) })
                                            : t('buyer.claims.payout_pending', 'Payout of {{amount}} is pending processing', { amount: formatPrice(Number(claim.expected_payout_amount), claim.region) })
                                        }
                                    </p>
                                    <p className="text-xs text-green-600 mt-0.5 opacity-80">
                                        {claim.payout_status === 'PROCESSED'
                                            ? t('buyer.claims.payment_completed', 'Payment completed')
                                            : t('buyer.claims.review_approved_note', 'Your review has been approved')
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Rejection Reason + Retry */}
                        {isRejected && claim.rejection_reason && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 text-destructive">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h5 className="font-medium text-sm">{t('buyer.claims.rejection_reason', 'Rejection Reason')}</h5>
                                    <p className="text-sm mt-1 opacity-90">{claim.rejection_reason}</p>
                                    <p className="text-xs mt-2 font-medium opacity-75">
                                        {(canRetryOrder || canRetryReview)
                                            ? t('buyer.claims.attempts_remaining', '{{count}} attempt remaining', { count: canRetryOrder ? orderAttemptsLeft : reviewAttemptsLeft })
                                            : t('buyer.claims.no_retries_left', 'No retries remaining')
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order Retry Form */}
                        {canRetryOrder && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    {t('buyer.claims.retry_order', 'Resubmit Order Proof')}
                                </h4>
                                <div className="bg-background border rounded-lg p-4 space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="retry-order-id">{t('buyer.claims.amazon_order_id', 'Amazon Order ID')}</Label>
                                        <Input
                                            id="retry-order-id"
                                            placeholder="e.g. 123-4567890-1234567"
                                            value={retryOrderId}
                                            onChange={(e) => setRetryOrderId(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{t('buyer.claims.purchase_date', 'Purchase Date')}</Label>
                                        <Popover open={retryDatePickerOpen} onOpenChange={setRetryDatePickerOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-start text-left font-normal',
                                                        !retrySelectedDate && 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {retrySelectedDate
                                                        ? format(retrySelectedDate, 'PPP')
                                                        : t('buyer.claims.select_purchase_date', 'Select purchase date')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={retrySelectedDate}
                                                    onSelect={(date) => {
                                                        setRetrySelectedDate(date);
                                                        setRetryDatePickerOpen(false);
                                                    }}
                                                    disabled={{ after: new Date() }}
                                                    toDate={new Date()}
                                                    fromYear={2020}
                                                    toYear={new Date().getFullYear()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{t('buyer.claims.order_screenshot', 'Order Screenshot')}</Label>
                                        <ImageUpload
                                            file={retryProofFile}
                                            onChange={setRetryProofFile}
                                            disabled={isRetrying}
                                        />
                                    </div>
                                    <Button onClick={handleRetryOrder} disabled={isRetrying} className="w-full">
                                        {isRetrying ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('buyer.claims.resubmitting', 'Resubmitting...')}</>
                                        ) : (
                                            <><RefreshCw className="w-4 h-4 mr-2" />{t('buyer.claims.resubmit_order', 'Resubmit Order Proof')}</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Review Retry Form */}
                        {canRetryReview && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    {t('buyer.claims.retry_review', 'Resubmit Review')}
                                </h4>
                                <div className="bg-background border rounded-lg p-4">
                                    <SubmitReviewForm claimId={claim.id} onSuccess={handleReviewSuccess} isRetry />
                                </div>
                            </div>
                        )}

                        {/* Cancel Action */}
                        {canCancel && (
                            <>
                                <Separator />
                                <Button
                                    variant="outline"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setCancelDialogOpen(true)}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    {t('buyer.claims.cancel_claim', 'Cancel This Claim')}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('buyer.claims.cancel_confirm_title', 'Cancel Claim?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('buyer.claims.cancel_confirm_desc', 'Are you sure you want to cancel your claim for this product? This action cannot be undone.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            {t('common.keep', 'Keep Claim')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isCancelling
                                ? t('buyer.claims.cancelling', 'Cancelling...')
                                : t('buyer.claims.confirm_cancel', 'Yes, Cancel Claim')
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
