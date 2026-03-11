import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Package, User, ChevronLeft, ChevronRight, Globe, Target, DollarSign, Percent } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { format } from 'date-fns';
import { formatPrice, REGION_DISPLAY_NAMES } from '@/lib/regions';

interface CampaignUser { full_name: string; email: string; }
interface CampaignSeller { company_name: string; User?: CampaignUser; }
interface CampaignData {
    product_title: string; product_image_url: string; status: string; asin: string;
    created_at: string; SellerProfile?: CampaignSeller; region: string;
    product_price: string; reimbursement_percent: number; target_reviews: number; guidelines?: string;
}
interface ClaimBuyerUser { full_name: string; email: string; }
interface ClaimBuyer { User?: ClaimBuyerUser; }
interface CampaignClaimItem {
    id: string; BuyerProfile?: ClaimBuyer; expected_payout_amount: string;
    order_status: string; review_status: string; payout_status: string;
}
interface PaginationMeta { page: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }
interface PaginatedClaims { data: CampaignClaimItem[]; pagination: PaginationMeta; }

interface CampaignDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: string;
}

const campaignStatusBadge = (status: string) => {
    switch (status) {
        case 'ACTIVE': return <Badge variant="default" className="capitalize">Active</Badge>;
        case 'PAUSED': return <Badge variant="secondary" className="capitalize">Paused</Badge>;
        case 'COMPLETED': return <Badge variant="outline" className="capitalize">Completed</Badge>;
        default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
};

const claimStatusBadge = (orderStatus: string, reviewStatus: string, payoutStatus: string) => {
    if (payoutStatus === 'PROCESSED') return <Badge variant="default">Reimbursed</Badge>;
    if (reviewStatus === 'APPROVED') return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
    if (reviewStatus === 'PENDING_VERIFICATION') return <Badge variant="secondary">Review Pending</Badge>;
    if (orderStatus === 'REJECTED' || reviewStatus === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>;
    if (orderStatus === 'PENDING_VERIFICATION') return <Badge variant="outline">Order Pending</Badge>;
    if (reviewStatus === 'AWAITING_UPLOAD') return <Badge variant="outline">Awaiting Review</Badge>;
    return <Badge variant="outline">{orderStatus}</Badge>;
};

export function CampaignDetailModal({ open, onOpenChange, campaignId }: CampaignDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<CampaignData | null>(null);
    const [claims, setClaims] = useState<PaginatedClaims | null>(null);
    const [claimsPage, setClaimsPage] = useState(1);

    const fetchDetail = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const result = await adminApi.getCampaignDetail(campaignId, page, 5);
            setCampaign(result.campaign);
            setClaims(result.claims);
        } catch { /* empty */ }
        finally { setLoading(false); }
    }, [campaignId]);

    useEffect(() => {
        if (open && campaignId) {
            setClaimsPage(1);
            fetchDetail(1);
        }
    }, [open, campaignId, fetchDetail]);

    useEffect(() => {
        if (open && campaignId) {
            fetchDetail(claimsPage);
        }
    }, [claimsPage, open, campaignId, fetchDetail]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto p-0">
                <SheetHeader className="p-6 pb-0">
                    <SheetTitle>Campaign Details</SheetTitle>
                </SheetHeader>

                {loading && !campaign ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : campaign ? (
                    <div className="p-6 pt-4 space-y-5">
                        {/* Product header */}
                        <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-lg border bg-muted/50 overflow-hidden flex-shrink-0">
                                {campaign.product_image_url
                                    ? <img src={campaign.product_image_url} alt="" className="h-12 w-12 object-cover" />
                                    : <div className="h-12 w-12 flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-base font-semibold leading-tight">{campaign.product_title}</h3>
                                    {campaignStatusBadge(campaign.status)}
                                </div>
                                <p className="text-xs text-muted-foreground font-mono mt-1">{campaign.asin}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {campaign.SellerProfile && <>by {campaign.SellerProfile.company_name || campaign.SellerProfile.User?.full_name || 'Unknown'} · </>}
                                    Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-3 flex items-center gap-3">
                                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">{REGION_DISPLAY_NAMES[campaign.region] || campaign.region}</p>
                                    <p className="text-[11px] text-muted-foreground">Region</p>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3 flex items-center gap-3">
                                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">{formatPrice(parseFloat(campaign.product_price), campaign.region)}</p>
                                    <p className="text-[11px] text-muted-foreground">Price</p>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3 flex items-center gap-3">
                                <Percent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">{campaign.reimbursement_percent}%</p>
                                    <p className="text-[11px] text-muted-foreground">Reimbursement</p>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3 flex items-center gap-3">
                                <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">{claims?.pagination?.total ?? 0} / {campaign.target_reviews}</p>
                                    <p className="text-[11px] text-muted-foreground">Claims / Target</p>
                                </div>
                            </div>
                        </div>

                        {campaign.guidelines && (
                            <div className="rounded-lg border p-3">
                                <p className="text-xs font-medium mb-1">Review Guidelines</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.guidelines}</p>
                            </div>
                        )}

                        <Separator />

                        {/* Claims */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Claims</h4>
                            {claims?.data?.length > 0 ? (
                                <div className="space-y-2">
                                    {claims.data.map((claim: CampaignClaimItem) => (
                                        <div key={claim.id} className="rounded-lg border p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full border bg-muted/50 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-medium flex-1">{claim.BuyerProfile?.User?.full_name || 'Unknown'}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {claim.BuyerProfile?.User?.email} · {formatPrice(parseFloat(claim.expected_payout_amount || '0'), campaign.region || 'com')}
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
