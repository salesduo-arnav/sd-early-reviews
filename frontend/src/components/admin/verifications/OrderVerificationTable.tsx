import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, Check, X, ExternalLink, User, Package } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi } from '@/api/admin';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/regions';

export function OrderVerificationTable() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPending, setTotalPending] = useState(0);
    const [rejectModal, setRejectModal] = useState<{ open: boolean; claimId: string }>({ open: false, claimId: '' });
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await adminApi.getPendingOrders(pagination.pageIndex + 1, pagination.pageSize, searchQuery || undefined);
            setData(result.data);
            setPageCount(result.pagination.totalPages);
            setTotalPending(result.pagination.total);
        } catch { /* empty */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

    const handleApprove = async (claimId: string) => {
        setActionLoading(claimId);
        try {
            await adminApi.verifyOrder(claimId, 'APPROVE');
            toast.success('Order approved');
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
        setActionLoading(rejectModal.claimId);
        try {
            await adminApi.verifyOrder(rejectModal.claimId, 'REJECT', rejectReason);
            toast.success('Order rejected');
            setRejectModal({ open: false, claimId: '' });
            setRejectReason('');
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        finally { setActionLoading(null); }
    };

    const columns = useMemo<ColumnDef<any, unknown>[]>(() => [
        {
            accessorKey: 'buyer',
            header: () => <DataTableStaticHeader title="Buyer" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.BuyerProfile?.User?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{row.original.BuyerProfile?.User?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'amazon_order_id',
            header: () => <DataTableStaticHeader title="Order ID" />,
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.amazon_order_id}
                </span>
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
                    <span className="max-w-[180px] truncate text-sm text-foreground">{row.original.Campaign?.product_title}</span>
                </div>
            ),
        },
        {
            accessorKey: 'purchase_date',
            header: () => <DataTableStaticHeader title="Purchase Date" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.purchase_date ? format(new Date(row.original.purchase_date), 'MMM d, yyyy') : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'expected_payout_amount',
            header: () => <DataTableStaticHeader title="Payout" />,
            cell: ({ row }) => (
                <span className="font-medium text-foreground">{formatPrice(parseFloat(row.original.expected_payout_amount), row.original.Campaign?.region || 'com')}</span>
            ),
        },
        {
            accessorKey: 'order_proof_url',
            header: () => <DataTableStaticHeader title="Proof" />,
            cell: ({ row }) => row.original.order_proof_url ? (
                <a href={row.original.order_proof_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-medium">
                    View <ExternalLink className="w-3 h-3" />
                </a>
            ) : <span className="text-muted-foreground">—</span>,
        },
        {
            id: 'actions',
            header: () => <DataTableStaticHeader title="Actions" srOnly />,
            cell: ({ row }) => (
                <div className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                                onClick={() => handleApprove(row.original.id)}
                                disabled={actionLoading === row.original.id}
                                className="cursor-pointer"
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Approve Order
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setRejectModal({ open: true, claimId: row.original.id })}
                                disabled={actionLoading === row.original.id}
                                className="text-destructive focus:text-destructive cursor-pointer"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Reject Order
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [actionLoading]);

    return (
        <div className="space-y-4">
            {totalPending > 0 && (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{totalPending} pending</Badge>
                </div>
            )}

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
                    onSearchChange={(sq) => { setSearchQuery(sq); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                    placeholder="Search by order ID, product, or ASIN..."
                    isLoading={loading}
                />
            </div>

            <Dialog open={rejectModal.open} onOpenChange={(open) => { setRejectModal({ open, claimId: open ? rejectModal.claimId : '' }); if (!open) setRejectReason(''); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject Order</DialogTitle></DialogHeader>
                    <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectModal({ open: false, claimId: '' })}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!!actionLoading}>Reject Order</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
