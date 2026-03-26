import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Package, User, ExternalLink, Star, Clock, Shield,
    CheckCircle2, XCircle, Circle, AlertTriangle, DollarSign,
} from 'lucide-react';
import { adminApi, type ClaimDetailResponse } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { format } from 'date-fns';
import { formatPrice, REGION_DISPLAY_NAMES } from '@/lib/regions';

interface ClaimDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    claimId: string;
    onAction?: () => void;
}

type StepState = 'completed' | 'current' | 'failed' | 'upcoming';

function getPipelineSteps(claim: ClaimDetailResponse): { label: string; state: StepState }[] {
    const steps: { label: string; state: StepState }[] = [];

    // Step 1: Order Submitted (always completed if claim exists)
    steps.push({ label: 'Order Submitted', state: 'completed' });

    // Step 2: Order Verified
    if (claim.order_status === 'APPROVED') {
        steps.push({ label: 'Order Verified', state: 'completed' });
    } else if (claim.order_status === 'REJECTED') {
        steps.push({ label: 'Order Rejected', state: 'failed' });
        steps.push({ label: 'Review', state: 'upcoming' });
        steps.push({ label: 'Payout', state: 'upcoming' });
        return steps;
    } else {
        steps.push({ label: 'Order Verification', state: 'current' });
        steps.push({ label: 'Review', state: 'upcoming' });
        steps.push({ label: 'Payout', state: 'upcoming' });
        return steps;
    }

    // Step 3: Review
    if (claim.review_status === 'APPROVED') {
        steps.push({ label: 'Review Verified', state: 'completed' });
    } else if (claim.review_status === 'REJECTED') {
        steps.push({ label: 'Review Rejected', state: 'failed' });
        steps.push({ label: 'Payout', state: 'upcoming' });
        return steps;
    } else if (claim.review_status === 'TIMEOUT') {
        steps.push({ label: 'Review Timed Out', state: 'failed' });
        steps.push({ label: 'Payout', state: 'upcoming' });
        return steps;
    } else if (claim.review_status === 'PENDING_VERIFICATION') {
        steps.push({ label: 'Review Pending', state: 'current' });
        steps.push({ label: 'Payout', state: 'upcoming' });
        return steps;
    } else {
        steps.push({ label: 'Awaiting Review', state: 'current' });
        steps.push({ label: 'Payout', state: 'upcoming' });
        return steps;
    }

    // Step 4: Payout
    if (claim.payout_status === 'PROCESSED') {
        steps.push({ label: 'Reimbursed', state: 'completed' });
    } else if (claim.payout_status === 'FAILED') {
        steps.push({ label: 'Payout Failed', state: 'failed' });
    } else if (claim.payout_status === 'PROCESSING') {
        steps.push({ label: 'Processing Payout', state: 'current' });
    } else if (claim.payout_status === 'PENDING') {
        steps.push({ label: 'Payout Pending', state: 'current' });
    } else {
        steps.push({ label: 'Payout', state: 'upcoming' });
    }

    return steps;
}

function StepIcon({ state }: { state: StepState }) {
    switch (state) {
        case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        case 'current': return <Circle className="h-5 w-5 text-blue-500 fill-blue-100" />;
        case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
        case 'upcoming': return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
}

function renderStars(rating: number) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-4 w-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
            ))}
        </div>
    );
}

export function ClaimDetailModal({ open, onOpenChange, claimId, onAction }: ClaimDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [claim, setClaim] = useState<ClaimDetailResponse | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; type: 'order' | 'review' }>({ open: false, type: 'order' });
    const [rejectReason, setRejectReason] = useState('');

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.getClaimDetail(claimId);
            setClaim(result);
        } catch (err) { toast.error(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [claimId]);

    useEffect(() => {
        if (open && claimId) fetchDetail();
    }, [open, claimId, fetchDetail]);

    const handleApprove = async (type: 'order' | 'review') => {
        setActionLoading(true);
        try {
            if (type === 'order') {
                await adminApi.verifyOrder(claimId, 'APPROVE');
                toast.success('Order approved');
            } else {
                await adminApi.verifyReview(claimId, 'APPROVE');
                toast.success('Review approved');
            }
            fetchDetail();
            onAction?.();
        } catch (e) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
        setActionLoading(true);
        try {
            if (rejectDialog.type === 'order') {
                await adminApi.verifyOrder(claimId, 'REJECT', rejectReason);
                toast.success('Order rejected');
            } else {
                await adminApi.verifyReview(claimId, 'REJECT', rejectReason);
                toast.success('Review rejected');
            }
            setRejectDialog({ open: false, type: 'order' });
            setRejectReason('');
            fetchDetail();
            onAction?.();
        } catch (e) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(false); }
    };

    const steps = claim ? getPipelineSteps(claim) : [];

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto p-0">
                    <SheetHeader className="p-6 pb-0">
                        <SheetTitle>Claim Details</SheetTitle>
                    </SheetHeader>

                    {loading && !claim ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : claim ? (
                        <div className="p-6 pt-4 space-y-5">
                            {/* Product header */}
                            <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-lg border bg-muted/50 overflow-hidden flex-shrink-0">
                                    {claim.Campaign?.product_image_url
                                        ? <img src={claim.Campaign.product_image_url} alt="" className="h-12 w-12 object-cover" />
                                        : <div className="h-12 w-12 flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold leading-tight">{claim.Campaign?.product_title}</h3>
                                    <p className="text-xs text-muted-foreground font-mono mt-1">{claim.Campaign?.asin}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {claim.Campaign?.region && REGION_DISPLAY_NAMES[claim.Campaign.region]}
                                        {' · '}
                                        {formatPrice(claim.expected_payout_amount, claim.Campaign?.region || 'US')} payout
                                    </p>
                                </div>
                            </div>

                            {/* Buyer info */}
                            <div className="rounded-lg border p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{claim.BuyerProfile?.User?.full_name || 'Unknown'}</span>
                                    {claim.BuyerProfile?.is_blacklisted && (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Blacklisted</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{claim.BuyerProfile?.User?.email}</p>
                                {claim.BuyerProfile?.amazon_profile_url && (
                                    <a
                                        href={claim.BuyerProfile.amazon_profile_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        Amazon Profile <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                {claim.BuyerProfile?.on_time_submission_rate != null && (
                                    <p className="text-xs text-muted-foreground">
                                        On-time rate: <span className="font-medium text-foreground">{claim.BuyerProfile.on_time_submission_rate.toFixed(0)}%</span>
                                    </p>
                                )}
                            </div>

                            {/* Pipeline progress */}
                            <div className="rounded-lg border p-4">
                                <p className="text-xs font-medium mb-3">Pipeline Progress</p>
                                <div className="flex items-center gap-1">
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
                                            <div className="flex flex-col items-center gap-1">
                                                <StepIcon state={step.state} />
                                                <span className={`text-[10px] text-center leading-tight ${
                                                    step.state === 'completed' ? 'text-green-700' :
                                                    step.state === 'current' ? 'text-blue-600 font-medium' :
                                                    step.state === 'failed' ? 'text-red-600' :
                                                    'text-muted-foreground/50'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                            {i < steps.length - 1 && (
                                                <div className={`h-px flex-1 mt-[-14px] ${
                                                    step.state === 'completed' ? 'bg-green-300' :
                                                    step.state === 'failed' ? 'bg-red-200' :
                                                    'bg-muted-foreground/20'
                                                }`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Order details */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Order Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3">
                                        <p className="text-[11px] text-muted-foreground">Order ID</p>
                                        <p className="text-sm font-mono font-medium mt-0.5 break-all">{claim.amazon_order_id}</p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-[11px] text-muted-foreground">Purchase Date</p>
                                        <p className="text-sm font-medium mt-0.5">
                                            {claim.purchase_date ? format(new Date(claim.purchase_date), 'MMM d, yyyy') : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-[11px] text-muted-foreground">Order Status</p>
                                        <div className="mt-1">
                                            {claim.order_status === 'APPROVED' && <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>}
                                            {claim.order_status === 'PENDING_VERIFICATION' && <Badge variant="secondary">Pending</Badge>}
                                            {claim.order_status === 'REJECTED' && <Badge variant="destructive">Rejected</Badge>}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-[11px] text-muted-foreground">Verification</p>
                                        <p className="text-sm font-medium mt-0.5">{claim.verification_method || '—'}</p>
                                    </div>
                                </div>
                                {claim.order_proof_url && (
                                    <a
                                        href={claim.order_proof_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                        View Order Proof <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>

                            {/* Review details */}
                            {claim.review_status !== 'AWAITING_UPLOAD' && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Star className="h-4 w-4" /> Review Details
                                        </h4>
                                        {claim.review_rating != null && (
                                            <div className="mb-2">{renderStars(claim.review_rating)}</div>
                                        )}
                                        {claim.review_title && (
                                            <p className="text-sm font-medium mb-1">{claim.review_title}</p>
                                        )}
                                        {claim.review_text && (
                                            <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{claim.review_text}</p>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-lg border p-3">
                                                <p className="text-[11px] text-muted-foreground">Review Status</p>
                                                <div className="mt-1">
                                                    {claim.review_status === 'APPROVED' && <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>}
                                                    {claim.review_status === 'PENDING_VERIFICATION' && <Badge variant="secondary">Pending</Badge>}
                                                    {claim.review_status === 'REJECTED' && <Badge variant="destructive">Rejected</Badge>}
                                                    {claim.review_status === 'TIMEOUT' && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Timeout</Badge>}
                                                </div>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <p className="text-[11px] text-muted-foreground">Verification</p>
                                                <p className="text-sm font-medium mt-0.5">{claim.review_verification_method || '—'}</p>
                                            </div>
                                            {claim.review_deadline && (
                                                <div className="rounded-lg border p-3">
                                                    <p className="text-[11px] text-muted-foreground">Deadline</p>
                                                    <p className="text-sm font-medium mt-0.5 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(claim.review_deadline), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            )}
                                            {claim.review_date && (
                                                <div className="rounded-lg border p-3">
                                                    <p className="text-[11px] text-muted-foreground">Review Date</p>
                                                    <p className="text-sm font-medium mt-0.5">
                                                        {format(new Date(claim.review_date), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {claim.review_proof_url && (
                                            <a
                                                href={claim.review_proof_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                View Review Proof <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Payout details */}
                            <Separator />
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" /> Payout Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3">
                                        <p className="text-[11px] text-muted-foreground">Amount</p>
                                        <p className="text-sm font-semibold mt-0.5">
                                            {formatPrice(claim.expected_payout_amount, claim.Campaign?.region || 'US')}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <p className="text-[11px] text-muted-foreground">Status</p>
                                        <div className="mt-1">
                                            {claim.payout_status === 'PROCESSED' && <Badge variant="default">Processed</Badge>}
                                            {claim.payout_status === 'PENDING' && <Badge variant="secondary">Pending</Badge>}
                                            {claim.payout_status === 'PROCESSING' && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>}
                                            {claim.payout_status === 'FAILED' && <Badge variant="destructive">Failed</Badge>}
                                            {claim.payout_status === 'NOT_ELIGIBLE' && <Badge variant="outline">Not Eligible</Badge>}
                                        </div>
                                    </div>
                                    {claim.payout_method && (
                                        <div className="rounded-lg border p-3">
                                            <p className="text-[11px] text-muted-foreground">Method</p>
                                            <p className="text-sm font-medium mt-0.5">{claim.payout_method}</p>
                                        </div>
                                    )}
                                    {claim.payout_processed_at && (
                                        <div className="rounded-lg border p-3">
                                            <p className="text-[11px] text-muted-foreground">Processed</p>
                                            <p className="text-sm font-medium mt-0.5">
                                                {format(new Date(claim.payout_processed_at), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    )}
                                    {claim.wise_transfer_id && (
                                        <div className="rounded-lg border p-3 col-span-2">
                                            <p className="text-[11px] text-muted-foreground">Wise Transfer ID</p>
                                            <p className="text-sm font-mono mt-0.5">{claim.wise_transfer_id}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rejection reason */}
                            {claim.rejection_reason && (
                                <>
                                    <Separator />
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                        <p className="text-xs font-medium text-red-800 flex items-center gap-1 mb-1">
                                            <AlertTriangle className="h-3 w-3" /> Rejection Reason
                                        </p>
                                        <p className="text-sm text-red-700">{claim.rejection_reason}</p>
                                    </div>
                                </>
                            )}

                            {/* Admin info */}
                            {claim.verification_method && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Verified via {claim.verification_method}
                                    {claim.auto_verified_at && <> on {format(new Date(claim.auto_verified_at), 'MMM d, yyyy')}</>}
                                </div>
                            )}

                            {/* Action buttons */}
                            {(claim.order_status === 'PENDING_VERIFICATION' || claim.review_status === 'PENDING_VERIFICATION') && (
                                <>
                                    <Separator />
                                    <div className="flex gap-2">
                                        {claim.order_status === 'PENDING_VERIFICATION' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove('order')}
                                                    disabled={actionLoading}
                                                    className="flex-1"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve Order
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setRejectDialog({ open: true, type: 'order' })}
                                                    disabled={actionLoading}
                                                    className="flex-1"
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" /> Reject Order
                                                </Button>
                                            </>
                                        )}
                                        {claim.review_status === 'PENDING_VERIFICATION' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove('review')}
                                                    disabled={actionLoading}
                                                    className="flex-1"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve Review
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setRejectDialog({ open: true, type: 'review' })}
                                                    disabled={actionLoading}
                                                    className="flex-1"
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" /> Reject Review
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>

            <Dialog open={rejectDialog.open} onOpenChange={(open) => { setRejectDialog({ open, type: rejectDialog.type }); if (!open) setRejectReason(''); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject {rejectDialog.type === 'order' ? 'Order' : 'Review'}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRejectDialog({ open: false, type: 'order' }); setRejectReason(''); }}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                            Reject {rejectDialog.type === 'order' ? 'Order' : 'Review'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
