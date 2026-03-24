import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, CheckCircle, XCircle, DollarSign, User, RotateCcw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi, type PayoutRow } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { formatPrice } from '@/lib/regions';
import { useAdminTable } from '@/hooks/use-admin-table';

const payoutBadge = (status: string) => {
    switch (status) {
        case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
        case 'PROCESSING': return <Badge variant="secondary" className="animate-pulse">Processing</Badge>;
        case 'PROCESSED': return <Badge variant="default" className="capitalize">Processed</Badge>;
        case 'FAILED': return <Badge variant="destructive">Failed</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

export function PayoutsTable() {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [overrideDialog, setOverrideDialog] = useState<{ open: boolean; claimId: string; currentAmount: number; region: string }>({ open: false, claimId: '', currentAmount: 0, region: 'com' });
    const [overrideAmount, setOverrideAmount] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchFn = useCallback(
        (page: number, size: number, search: string | undefined) =>
            adminApi.getPayouts(page, size, statusFilter, search),
        [statusFilter],
    );

    const { data, loading, pagination, setPagination, pageCount, searchQuery, setSearchQuery, refetch } = useAdminTable<PayoutRow>({ fetchFn });

    const handleUpdateStatus = useCallback(async (claimId: string, status: 'PROCESSED' | 'FAILED') => {
        setActionLoading(claimId);
        try {
            await adminApi.updatePayoutStatus(claimId, status);
            toast.success(`Payout marked as ${status.toLowerCase()}`);
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(null); }
    }, [refetch]);

    const handleRetry = useCallback(async (claimId: string) => {
        setActionLoading(claimId);
        try {
            await adminApi.retryPayout(claimId);
            toast.success('Payout retried successfully');
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(null); }
    }, [refetch]);

    const handleOverride = async () => {
        const amount = parseFloat(overrideAmount);
        if (isNaN(amount) || amount < 0) { toast.error('Invalid amount'); return; }
        setActionLoading(overrideDialog.claimId);
        try {
            await adminApi.updatePayoutStatus(overrideDialog.claimId, 'PROCESSED', amount);
            toast.success('Payout overridden and processed');
            setOverrideDialog({ open: false, claimId: '', currentAmount: 0, region: 'com' });
            setOverrideAmount('');
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(null); }
    };

    const handleBatchProcess = async () => {
        if (selectedIds.length === 0) { toast.error('No payouts selected'); return; }
        try {
            await adminApi.batchUpdatePayouts(selectedIds, 'PROCESSED');
            toast.success(`${selectedIds.length} payouts processed`);
            setSelectedIds([]);
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const pendingIds = useMemo(() => data.filter((c: PayoutRow) => c.payout_status === 'PENDING').map((c: PayoutRow) => c.id), [data]);
    const allPendingSelected = useMemo(() => pendingIds.length > 0 && pendingIds.every((id: string) => selectedIds.includes(id)), [pendingIds, selectedIds]);

    const columns = useMemo<ColumnDef<PayoutRow, unknown>[]>(() => [
        {
            id: 'select',
            size: 40,
            header: () => (
                <Checkbox
                    checked={allPendingSelected}
                    onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(pendingIds);
                        else setSelectedIds([]);
                    }}
                />
            ),
            cell: ({ row }) => row.original.payout_status === 'PENDING' ? (
                <Checkbox
                    checked={selectedIds.includes(row.original.id)}
                    onCheckedChange={() => toggleSelect(row.original.id)}
                />
            ) : null,
        },
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
            cell: ({ row }) => <span className="max-w-[160px] truncate text-muted-foreground block">{row.original.Campaign?.product_title}</span>,
        },
        {
            accessorKey: 'bank',
            header: () => <DataTableStaticHeader title="Bank" />,
            cell: ({ row }) => row.original.BuyerProfile?.wise_recipient_id
                ? <span className="text-xs text-muted-foreground">{row.original.BuyerProfile?.bank_display_label || 'Connected'}</span>
                : <Badge variant="destructive" className="text-xs">Not connected</Badge>,
        },
        {
            accessorKey: 'expected_payout_amount',
            header: () => <DataTableStaticHeader title="Amount" />,
            cell: ({ row }) => <span className="font-medium text-foreground">{formatPrice(row.original.expected_payout_amount, row.original.Campaign?.region || 'com')}</span>,
        },
        {
            accessorKey: 'payout_status',
            header: () => <DataTableStaticHeader title="Status" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    {payoutBadge(row.original.payout_status)}
                    {row.original.payout_status === 'PROCESSED' && row.original.payout_method && (
                        <Badge variant="outline" className="text-[10px] capitalize">{row.original.payout_method.toLowerCase()}</Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <DataTableStaticHeader title="Actions" srOnly />,
            cell: ({ row }) => {
                const status = row.original.payout_status;
                if (status !== 'PENDING' && status !== 'FAILED') return null;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {status === 'FAILED' ? (
                                    <DropdownMenuItem
                                        onClick={() => handleRetry(row.original.id)}
                                        disabled={actionLoading === row.original.id}
                                        className="cursor-pointer"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Retry Payout
                                    </DropdownMenuItem>
                                ) : (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateStatus(row.original.id, 'PROCESSED')}
                                            disabled={actionLoading === row.original.id}
                                            className="cursor-pointer"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Mark Processed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => { setOverrideDialog({ open: true, claimId: row.original.id, currentAmount: row.original.expected_payout_amount, region: row.original.Campaign?.region || 'com' }); setOverrideAmount(row.original.expected_payout_amount.toString()); }}
                                            className="cursor-pointer"
                                        >
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Override Amount
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleUpdateStatus(row.original.id, 'FAILED')}
                                            disabled={actionLoading === row.original.id}
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Mark Failed
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [actionLoading, selectedIds, allPendingSelected, handleUpdateStatus, handleRetry, pendingIds]);

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSED">Processed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                </Select>
                {selectedIds.length > 0 && (
                    <Button size="sm" className="h-9" onClick={handleBatchProcess}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Process {selectedIds.length} Selected
                    </Button>
                )}
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
                    placeholder="Search by order ID, product, ASIN, or buyer..."
                    isLoading={loading}
                />
            </div>

            <Dialog open={overrideDialog.open} onOpenChange={(open) => { if (!open) setOverrideDialog({ open: false, claimId: '', currentAmount: 0, region: 'com' }); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Override Payout Amount</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground">Current Amount: <span className="text-foreground font-medium">{formatPrice(parseFloat(overrideDialog.currentAmount.toString()), overrideDialog.region)}</span></Label>
                        </div>
                        <div>
                            <Label>New Amount</Label>
                            <Input type="number" step="0.01" min="0" value={overrideAmount} onChange={(e) => setOverrideAmount(e.target.value)} className="mt-1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOverrideDialog({ open: false, claimId: '', currentAmount: 0, region: 'com' })}>Cancel</Button>
                        <Button onClick={handleOverride} disabled={!!actionLoading}>Override & Process</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
