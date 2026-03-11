import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Building2, DollarSign, Package, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { format } from 'date-fns';
import { formatPrice, REGION_DISPLAY_NAMES } from '@/lib/regions';

interface SellerUser { full_name: string; email: string; created_at: string; }
interface SellerData { User?: SellerUser; company_name?: string; }
interface SellerCampaignItem {
    id: string; product_title: string; product_image_url: string; asin: string;
    region: string; product_price: string; target_reviews: number; status: string;
}
interface PaginationMeta { page: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }
interface PaginatedCampaigns { data: SellerCampaignItem[]; pagination: PaginationMeta; }

interface SellerDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sellerId: string;
}

const campaignStatusBadge = (status: string) => {
    switch (status) {
        case 'ACTIVE': return <Badge variant="default" className="capitalize">Active</Badge>;
        case 'PAUSED': return <Badge variant="secondary" className="capitalize">Paused</Badge>;
        case 'COMPLETED': return <Badge variant="outline" className="capitalize">Completed</Badge>;
        default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
};

export function SellerDetailModal({ open, onOpenChange, sellerId }: SellerDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<SellerData | null>(null);
    const [campaigns, setCampaigns] = useState<PaginatedCampaigns | null>(null);
    const [totalSpent, setTotalSpent] = useState(0);
    const [campaignsPage, setCampaignsPage] = useState(1);

    const fetchDetail = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const result = await adminApi.getSellerDetail(sellerId, page, 5);
            setSeller(result.seller);
            setCampaigns(result.campaigns);
            setTotalSpent(result.totalSpent);
        } catch { /* empty */ }
        finally { setLoading(false); }
    }, [sellerId]);

    useEffect(() => {
        if (open && sellerId) {
            setCampaignsPage(1);
            fetchDetail(1);
        }
    }, [open, sellerId, fetchDetail]);

    useEffect(() => {
        if (open && sellerId) {
            fetchDetail(campaignsPage);
        }
    }, [campaignsPage, open, sellerId, fetchDetail]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto p-0">
                <SheetHeader className="p-6 pb-0">
                    <SheetTitle>Seller Details</SheetTitle>
                </SheetHeader>

                {loading && !seller ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : seller ? (
                    <div className="p-6 pt-4 space-y-5">
                        {/* Profile header */}
                        <div>
                            <h3 className="text-base font-semibold">{seller.User?.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{seller.User?.email}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {seller.company_name && (
                                    <Badge variant="outline" className="gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {seller.company_name}
                                    </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    Joined {seller.User?.created_at ? format(new Date(seller.User.created_at), 'MMM d, yyyy') : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border p-3 text-center">
                                <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-base font-semibold">{campaigns?.pagination?.total ?? 0}</p>
                                <p className="text-[11px] text-muted-foreground">Campaigns</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-base font-semibold">
                                    {campaigns?.data?.filter((c: SellerCampaignItem) => c.status === 'ACTIVE').length ?? 0}
                                </p>
                                <p className="text-[11px] text-muted-foreground">Active</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-base font-semibold">${totalSpent.toFixed(2)}</p>
                                <p className="text-[11px] text-muted-foreground">Spent</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Campaigns */}
                        <div>
                            <h4 className="text-sm font-semibold mb-3">Campaigns</h4>
                            {campaigns?.data?.length > 0 ? (
                                <div className="space-y-2">
                                    {campaigns.data.map((campaign: SellerCampaignItem) => (
                                        <div key={campaign.id} className="rounded-lg border p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded border bg-muted/50 overflow-hidden flex-shrink-0">
                                                    {campaign.product_image_url
                                                        ? <img src={campaign.product_image_url} alt="" className="h-7 w-7 object-cover" />
                                                        : <div className="h-7 w-7 flex items-center justify-center"><Package className="h-3 w-3 text-muted-foreground" /></div>}
                                                </div>
                                                <p className="text-sm font-medium leading-tight flex-1">{campaign.product_title}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {campaign.asin}
                                                    {campaign.region && ` · ${REGION_DISPLAY_NAMES[campaign.region] || campaign.region}`}
                                                    {` · ${formatPrice(parseFloat(campaign.product_price || '0'), campaign.region || 'com')}`}
                                                    {` · ${campaign.target_reviews} reviews`}
                                                </span>
                                                {campaignStatusBadge(campaign.status)}
                                            </div>
                                        </div>
                                    ))}
                                    {campaigns.pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs text-muted-foreground">
                                                Page {campaigns.pagination.page} of {campaigns.pagination.totalPages}
                                            </span>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" disabled={!campaigns.pagination.hasPrev} onClick={() => setCampaignsPage(p => p - 1)}>
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="outline" size="sm" disabled={!campaigns.pagination.hasNext} onClick={() => setCampaignsPage(p => p + 1)}>
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No campaigns yet.</p>
                            )}
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
