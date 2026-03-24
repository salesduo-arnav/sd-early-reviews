import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi, type TransactionRow } from '@/api/admin';
import { format } from 'date-fns';
import { useAdminTable } from '@/hooks/use-admin-table';

const typeBadge = (type: string) => {
    switch (type) {
        case 'SELLER_CHARGE': return <Badge variant="default" className="capitalize">Seller Charge</Badge>;
        case 'BUYER_PAYOUT': return <Badge variant="secondary" className="capitalize">Buyer Payout</Badge>;
        case 'REFUND': return <Badge variant="destructive">Refund</Badge>;
        default: return <Badge variant="outline">{type}</Badge>;
    }
};

const statusBadge = (status: string) => {
    switch (status) {
        case 'SUCCESS': return <Badge variant="default" className="capitalize">Success</Badge>;
        case 'FAILED': return <Badge variant="destructive">Failed</Badge>;
        case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

export function TransactionsTable() {
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchFn = useCallback(
        (page: number, size: number, search: string | undefined) =>
            adminApi.getTransactions(page, size, typeFilter, statusFilter, search),
        [typeFilter, statusFilter],
    );

    const { data, loading, pagination, setPagination, pageCount, searchQuery, setSearchQuery } = useAdminTable<TransactionRow>({ fetchFn });

    const columns = useMemo<ColumnDef<TransactionRow, unknown>[]>(() => [
        {
            accessorKey: 'user',
            header: () => <DataTableStaticHeader title="User" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.User?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{row.original.User?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: () => <DataTableStaticHeader title="Type" />,
            cell: ({ row }) => typeBadge(row.original.type),
        },
        {
            accessorKey: 'gross_amount',
            header: () => <DataTableStaticHeader title="Gross" />,
            cell: ({ row }) => <span className="font-medium text-foreground">${parseFloat(row.original.gross_amount).toFixed(2)}</span>,
        },
        {
            accessorKey: 'platform_fee',
            header: () => <DataTableStaticHeader title="Fee" />,
            cell: ({ row }) => <span className="text-muted-foreground">${parseFloat(row.original.platform_fee).toFixed(2)}</span>,
        },
        {
            accessorKey: 'net_amount',
            header: () => <DataTableStaticHeader title="Net" />,
            cell: ({ row }) => <span className="font-semibold text-foreground">${parseFloat(row.original.net_amount).toFixed(2)}</span>,
        },
        {
            accessorKey: 'stripe_transaction_id',
            header: () => <DataTableStaticHeader title="Stripe ID" />,
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.stripe_transaction_id}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: () => <DataTableStaticHeader title="Status" />,
            cell: ({ row }) => statusBadge(row.original.status),
        },
        {
            accessorKey: 'created_at',
            header: () => <DataTableStaticHeader title="Date" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {format(new Date(row.original.created_at), 'MMM d, yyyy')}
                </span>
            ),
        },
    ], []);

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                    <SelectTrigger className="w-[170px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="SELLER_CHARGE">Seller Charge</SelectItem>
                        <SelectItem value="BUYER_PAYOUT">Buyer Payout</SelectItem>
                        <SelectItem value="REFUND">Refund</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                    <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
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
                    placeholder="Search by Stripe ID..."
                    isLoading={loading}
                />
            </div>
        </div>
    );
}
