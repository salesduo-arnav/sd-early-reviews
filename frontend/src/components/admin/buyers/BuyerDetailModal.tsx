import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Globe, Clock, DollarSign, CheckCircle, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { adminApi, type BuyerDetailResponse } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { format } from 'date-fns';
import { formatPrice, REGION_DISPLAY_NAMES } from '@/lib/regions';

interface BuyerDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buyerId: string;
}

const claimStatusBadge = (orderStatus: string, reviewStatus: string, payoutStatus: string) => {
    if (payoutStatus === 'PROCESSED') return <Badge variant="default">Reimbursed</Badge>;
    if (reviewStatus === 'APPROVED') return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
    if (reviewStatus === 'PENDING_VERIFICATION') return <Badge variant="secondary">Review Pending</Badge>;
    if (orderStatus === 'REJECTED' || reviewStatus === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>;
    if (orderStatus === 'PENDING_VERIFICATION') return <Badge variant="outline">Order Pending</Badge>;
    if (reviewStatus === 'AWAITING_UPLOAD') return <Badge variant="outline">Awaiting Review</Badge>;
    return <Badge variant="outline">{orderStatus}</Badge>;
};

export function BuyerDetailModal({ open, onOpenChange, buyerId }: BuyerDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [buyer, setBuyer] = useState<BuyerDetailResponse['buyer'] | null>(null);
    const [claims, setClaims] = useState<BuyerDetailResponse['claims'] | null>(null);
    const [claimsPage, setClaimsPage] = useState(1);

    const fetchDetail = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const result = await adminApi.getBuyerDetail(buyerId, page, 5);
            setBuyer(result.buyer);
            setClaims(result.claims);
        } catch (err) { toast.error(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [buyerId]);

    useEffect(() => {
        if (open && buyerId) {
            setClaimsPage(1);
            fetchDetail(1);
        }
    }, [open, buyerId, fetchDetail]);

    useEffect(() => {
        if (open && buyerId) {
            fetchDetail(claimsPage);
        }
    }, [claimsPage, open, buyerId, fetchDetail]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto p-0">
                <SheetHeader className="p-6 pb-0">
                    <SheetTitle>Buyer Details</SheetTitle>
                </SheetHeader>

                {loading && !buyer ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : buyer ? (
                    <div className="p-6 pt-4 space-y-5">
                        {/* Profile header */}
                        <div>
                            <h3 className="text-base font-semibold">{buyer.User?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{buyer.User?.email}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {buyer.is_blacklisted && <Badge variant="destructive">Blacklisted</Badge>}
                                {buyer.region && (
                                    <Badge variant="outline" className="gap-1">
                                        <Globe className="h-3 w-3" />
                                        {REGION_DISPLAY_NAMES[buyer.region] || buyer.region}
                                    </Badge>
                                )}
                                {buyer.User?.is_verified && (
                                    <Badge variant="outline" className="gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Verified
                                    </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    Joined {buyer.User?.created_at ? format(new Date(buyer.User.created_at), 'MMM d, yyyy') : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border p-3 text-center">
                                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-base font-semibold">{buyer.on_time_submission_rate?.toFixed(0) ?? '—'}%</p>
                                <p className="text-[11px] text-muted-foreground">On-Time</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-base font-semibold">{formatPrice(parseFloat(buyer.total_earnings || '0'), buyer.region || 'com')}</p>
                                <p className="text-[11px] text-muted-foreground">Earnings</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-base font-semibold">{claims?.pagination?.total ?? 0}</p>
                                <p className="text-[11px] text-muted-foreground">Claims</p>
                            </div>
                        </div>

                        {buyer.is_blacklisted && buyer.blacklist_reason && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                                <p className="text-xs font-medium text-destructive">Blacklist Reason</p>
                                <p className="text-sm text-destructive/80 mt-1">{buyer.blacklist_reason}</p>
                            </div>
                        )}

                        <Separator />

                        {/* Claims */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Claims History</h4>
                            {claims?.data?.length > 0 ? (
                                <div className="space-y-2">
                                    {claims.data.map((claim) => (
                                        <div key={claim.id} className="rounded-lg border p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded border bg-muted/50 overflow-hidden flex-shrink-0">
                                                    {claim.Campaign?.product_image_url
                                                        ? <img src={claim.Campaign.product_image_url} alt="" className="h-7 w-7 object-cover" />
                                                        : <div className="h-7 w-7 flex items-center justify-center"><Package className="h-3 w-3 text-muted-foreground" /></div>}
                                                </div>
                                                <p className="text-sm font-medium leading-tight flex-1">{claim.Campaign?.product_title || 'Unknown'}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {claim.Campaign?.asin} · {formatPrice(parseFloat(claim.expected_payout_amount || '0'), claim.Campaign?.region || 'com')}
                                                </span>
                                                {claimStatusBadge(claim.order_status, claim.review_status, claim.payout_status)}
                                            </div>
                                        </div>
                                    ))}
                                    {claims.pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs text-muted-foreground">
                                                Page {claims.pagination.page} of {claims.pagination.totalPages}
                                            </span>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" disabled={!claims.pagination.hasPrev} onClick={() => setClaimsPage(p => p - 1)}>
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="outline" size="sm" disabled={!claims.pagination.hasNext} onClick={() => setClaimsPage(p => p + 1)}>
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No claims yet.</p>
                            )}
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
