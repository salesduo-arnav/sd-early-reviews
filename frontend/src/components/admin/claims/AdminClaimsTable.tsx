import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, Check, X, Eye, User, Package } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi, type ClaimRow } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { formatPrice } from '@/lib/regions';
import { useAdminTable } from '@/hooks/use-admin-table';
import { ClaimDetailModal } from './ClaimDetailModal';

const pipelineStageBadge = (orderStatus: string, reviewStatus: string, payoutStatus: string) => {
    if (payoutStatus === 'PROCESSED') return <Badge variant="default">Reimbursed</Badge>;
    if (payoutStatus === 'PROCESSING') return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
    if (payoutStatus === 'FAILED') return <Badge variant="destructive">Payout Failed</Badge>;
    if (reviewStatus === 'APPROVED') return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
    if (reviewStatus === 'PENDING_VERIFICATION') return <Badge variant="secondary">Review Pending</Badge>;
    if (reviewStatus === 'REJECTED') return <Badge variant="destructive">Review Rejected</Badge>;
    if (reviewStatus === 'TIMEOUT') return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Timed Out</Badge>;
    if (reviewStatus === 'AWAITING_UPLOAD') return <Badge variant="outline">Awaiting Review</Badge>;
    if (orderStatus === 'REJECTED') return <Badge variant="destructive">Order Rejected</Badge>;
    if (orderStatus === 'PENDING_VERIFICATION') return <Badge variant="outline">Order Pending</Badge>;
    return <Badge variant="outline">{orderStatus}</Badge>;
};

const orderStatusBadge = (status: string) => {
    switch (status) {
        case 'APPROVED': return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
        case 'PENDING_VERIFICATION': return <Badge variant="secondary">Pending</Badge>;
        case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const reviewStatusBadge = (status: string) => {
    switch (status) {
        case 'APPROVED': return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
        case 'PENDING_VERIFICATION': return <Badge variant="secondary">Pending</Badge>;
        case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
        case 'AWAITING_UPLOAD': return <Badge variant="outline">Awaiting</Badge>;
        case 'TIMEOUT': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Timeout</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const payoutStatusBadge = (status: string) => {
    switch (status) {
        case 'PROCESSED': return <Badge variant="default">Processed</Badge>;
        case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
        case 'PROCESSING': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
        case 'FAILED': return <Badge variant="destructive">Failed</Badge>;
        case 'NOT_ELIGIBLE': return <Badge variant="outline">N/A</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

export function AdminClaimsTable() {
    const [pipelineFilter, setPipelineFilter] = useState('ALL');
    const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
    const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL');
    const [payoutStatusFilter, setPayoutStatusFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [detailModal, setDetailModal] = useState<{ open: boolean; claimId: string }>({ open: false, claimId: '' });
    const [rejectModal, setRejectModal] = useState<{ open: boolean; claimId: string; type: 'order' | 'review' }>({ open: false, claimId: '', type: 'order' });
    const [rejectReason, setRejectReason] = useState('');

    const fetchFn = useCallback(
        (page: number, size: number, search: string | undefined) =>
            adminApi.getClaims(page, size, search, pipelineFilter, orderStatusFilter, reviewStatusFilter, payoutStatusFilter),
        [pipelineFilter, orderStatusFilter, reviewStatusFilter, payoutStatusFilter],
    );

    const { data, loading, pagination, setPagination, pageCount, searchQuery, setSearchQuery, refetch } = useAdminTable<ClaimRow>({ fetchFn });

    const handleApproveOrder = useCallback(async (claimId: string) => {
        setActionLoading(claimId);
        try {
            await adminApi.verifyOrder(claimId, 'APPROVE');
            toast.success('Order approved');
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(null); }
    }, [refetch]);

    const handleApproveReview = useCallback(async (claimId: string) => {
        setActionLoading(claimId);
        try {
            await adminApi.verifyReview(claimId, 'APPROVE');
            toast.success('Review approved');
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(null); }
    }, [refetch]);

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
        setActionLoading(rejectModal.claimId);
        try {
            if (rejectModal.type === 'order') {
                await adminApi.verifyOrder(rejectModal.claimId, 'REJECT', rejectReason);
                toast.success('Order rejected');
            } else {
                await adminApi.verifyReview(rejectModal.claimId, 'REJECT', rejectReason);
                toast.success('Review rejected');
            }
            setRejectModal({ open: false, claimId: '', type: 'order' });
            setRejectReason('');
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(null); }
    };

    const handleFilterChange = (setter: (val: string) => void) => (val: string) => {
        setter(val);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const columns = useMemo<ColumnDef<ClaimRow, unknown>[]>(() => [
        {
            accessorKey: 'buyer',
            header: () => <DataTableStaticHeader title="Buyer" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.BuyerProfile?.User?.full_name || '—'}</p>
                        <p className="text-sm text-muted-foreground">{row.original.BuyerProfile?.User?.email || '—'}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'product',
            header: () => <DataTableStaticHeader title="Product" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50 overflow-hidden flex-shrink-0">
                        {row.original.Campaign?.product_image_url
                            ? <img src={row.original.Campaign.product_image_url} alt="" className="h-9 w-9 object-cover" />
                            : <Package className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-[180px] truncate font-medium text-foreground">{row.original.Campaign?.product_title}</p>
                        <p className="text-sm text-muted-foreground font-mono">{row.original.Campaign?.asin}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'amazon_order_id',
            header: () => <DataTableStaticHeader title="Order ID" />,
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">{row.original.amazon_order_id}</span>
            ),
        },
        {
            id: 'stage',
            header: () => <DataTableStaticHeader title="Stage" />,
            cell: ({ row }) => pipelineStageBadge(row.original.order_status, row.original.review_status, row.original.payout_status),
        },
        {
            accessorKey: 'order_status',
            header: () => <DataTableStaticHeader title="Order" />,
            cell: ({ row }) => orderStatusBadge(row.original.order_status),
        },
        {
            accessorKey: 'review_status',
            header: () => <DataTableStaticHeader title="Review" />,
            cell: ({ row }) => reviewStatusBadge(row.original.review_status),
        },
        {
            accessorKey: 'payout_status',
            header: () => <DataTableStaticHeader title="Payout" />,
            cell: ({ row }) => payoutStatusBadge(row.original.payout_status),
        },
        {
            id: 'actions',
            header: () => <DataTableStaticHeader title="Actions" srOnly />,
            cell: ({ row }) => {
                const { order_status, review_status } = row.original;
                const canActOnOrder = order_status === 'PENDING_VERIFICATION';
                const canActOnReview = review_status === 'PENDING_VERIFICATION';

                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => setDetailModal({ open: true, claimId: row.original.id })}
                                    className="cursor-pointer"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                {canActOnOrder && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleApproveOrder(row.original.id)}
                                            disabled={actionLoading === row.original.id}
                                            className="cursor-pointer"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve Order
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => { setRejectModal({ open: true, claimId: row.original.id, type: 'order' }); }}
                                            disabled={actionLoading === row.original.id}
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject Order
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canActOnReview && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleApproveReview(row.original.id)}
                                            disabled={actionLoading === row.original.id}
                                            className="cursor-pointer"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve Review
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => { setRejectModal({ open: true, claimId: row.original.id, type: 'review' }); }}
                                            disabled={actionLoading === row.original.id}
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject Review
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [actionLoading, handleApproveOrder, handleApproveReview]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <Select value={pipelineFilter} onValueChange={handleFilterChange(setPipelineFilter)}>
                    <SelectTrigger className="w-[170px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Stages</SelectItem>
                        <SelectItem value="ORDER_VERIFICATION_PENDING">Order Verification Pending</SelectItem>
                        <SelectItem value="ORDER_REJECTED">Order Rejected</SelectItem>
                        <SelectItem value="AWAITING_REVIEW">Awaiting Review</SelectItem>
                        <SelectItem value="REVIEW_VERIFICATION_PENDING">Review Verification Pending</SelectItem>
                        <SelectItem value="REVIEW_REJECTED">Review Rejected</SelectItem>
                        <SelectItem value="REVIEW_TIMEOUT">Review Timeout</SelectItem>
                        <SelectItem value="PAYOUT_PENDING">Payout Pending</SelectItem>
                        <SelectItem value="PAYOUT_PROCESSING">Payout Processing</SelectItem>
                        <SelectItem value="REIMBURSED">Reimbursed</SelectItem>
                        <SelectItem value="PAYOUT_FAILED">Payout Failed</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={orderStatusFilter} onValueChange={handleFilterChange(setOrderStatusFilter)}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Orders</SelectItem>
                        <SelectItem value="PENDING_VERIFICATION">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={reviewStatusFilter} onValueChange={handleFilterChange(setReviewStatusFilter)}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Reviews</SelectItem>
                        <SelectItem value="AWAITING_UPLOAD">Awaiting</SelectItem>
                        <SelectItem value="PENDING_VERIFICATION">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="TIMEOUT">Timeout</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={payoutStatusFilter} onValueChange={handleFilterChange(setPayoutStatusFilter)}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Payouts</SelectItem>
                        <SelectItem value="NOT_ELIGIBLE">Not Eligible</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="PROCESSED">Processed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={data}
                    pageCount={pageCount}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    sorting={[]}
                    onSortingChange={() => {}}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    placeholder="Search by buyer, order ID, product, or ASIN..."
                    isLoading={loading}
                />
            </div>

            <ClaimDetailModal
                open={detailModal.open}
                onOpenChange={(open) => { if (!open) setDetailModal({ open: false, claimId: '' }); }}
                claimId={detailModal.claimId}
                onAction={refetch}
            />

            <Dialog open={rejectModal.open} onOpenChange={(open) => { setRejectModal({ open, claimId: open ? rejectModal.claimId : '', type: rejectModal.type }); if (!open) setRejectReason(''); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject {rejectModal.type === 'order' ? 'Order' : 'Review'}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRejectModal({ open: false, claimId: '', type: 'order' }); setRejectReason(''); }}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!!actionLoading}>
                            Reject {rejectModal.type === 'order' ? 'Order' : 'Review'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
