import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SellerReview } from '@/api/dashboard/seller';
import { format } from 'date-fns';
import { Star, ExternalLink, Calendar, Receipt, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ReviewDetailsModalProps {
    review: SellerReview | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReviewDetailsModal({ review, open, onOpenChange }: ReviewDetailsModalProps) {
    const { t } = useTranslation();

    if (!review) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-500/10 text-green-700 border-green-200">{t('status.approved', 'Approved')}</Badge>;
            case 'PENDING_VERIFICATION':
                return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-200">{t('status.pending', 'Pending')}</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">{t('status.rejected', 'Rejected')}</Badge>;
            case 'TIMEOUT':
                return <Badge variant="outline" className="text-gray-500">{t('status.timeout', 'Timeout')}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex justify-between items-start pr-4">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {t('seller.reviews.details_title', 'Review Details')}
                                {getStatusBadge(review.review_status)}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {review.review_date
                                    ? t('seller.reviews.posted_on', 'Posted on {{date}}', { date: format(new Date(review.review_date), 'MMMM d, yyyy') })
                                    : t('seller.reviews.not_posted', 'Review not yet posted or date unavailable')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Product & Order Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                        <div className="flex gap-3">
                            <div className="w-16 h-16 rounded overflow-hidden bg-background border shrink-0">
                                {review.product_image_url ? (
                                    <img src={review.product_image_url} alt="Product" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                                        No Img
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">ASIN</span>
                                <a
                                    href={`https://amazon.com/dp/${review.asin}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-brand-primary hover:underline flex items-center gap-1"
                                >
                                    {review.asin} <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center border-l md:pl-4 pl-0 border-t md:border-t-0 pt-4 md:pt-0">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                        <Receipt className="w-3 h-3" /> {t('common.order_id', 'Order ID')}
                                    </span>
                                    <div className="font-medium text-sm mt-0.5">{review.amazon_order_id}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                        {t('common.payout', 'Payout')}
                                    </span>
                                    <div className="font-medium text-sm mt-0.5 text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded border border-green-200">
                                        ${Number(review.expected_payout_amount).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Review Content */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('seller.reviews.content', 'Review Content')}</h4>
                        <div className="bg-background border rounded-lg p-4 space-y-3">
                            {review.review_rating && (
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < review.review_rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 fill-gray-200'}`}
                                        />
                                    ))}
                                    <span className="ml-2 font-medium text-sm">{review.review_rating} out of 5</span>
                                </div>
                            )}

                            <Separator />

                            <div className="text-sm">
                                {review.review_text ? (
                                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{review.review_text}</p>
                                ) : (
                                    <p className="italic text-muted-foreground">{t('seller.reviews.no_text_provided', 'No review text provided by the buyer.')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason (If Applicable) */}
                    {review.review_status === 'REJECTED' && review.rejection_reason && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 text-destructive">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="font-medium text-sm">{t('seller.reviews.rejection_reason', 'Rejection Reason')}</h5>
                                <p className="text-sm mt-1 opacity-90">{review.rejection_reason}</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
