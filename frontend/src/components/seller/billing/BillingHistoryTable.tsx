import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { billingApi, BillingTransaction } from '@/api/billing';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, React.ReactNode> = {
    SUCCESS: <Badge variant="default" className="bg-green-600 hover:bg-green-700">Success</Badge>,
    PENDING: <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">Pending</Badge>,
    FAILED: <Badge variant="destructive">Failed</Badge>,
};

const columns: ColumnDef<BillingTransaction, unknown>[] = [
    {
        accessorKey: 'created_at',
        header: () => <DataTableStaticHeader title="Date" />,
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {format(new Date(row.original.created_at), 'MMM d, yyyy')}
            </span>
        ),
    },
    {
        accessorKey: 'stripe_transaction_id',
        header: () => <DataTableStaticHeader title="Transaction ID" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground truncate max-w-[180px] block">
                {row.original.stripe_transaction_id}
            </span>
        ),
    },
    {
        accessorKey: 'gross_amount',
        header: () => <DataTableStaticHeader title="Amount" />,
        cell: ({ row }) => (
            <span className="font-semibold text-foreground">
                ${Number(row.original.gross_amount).toFixed(2)}
            </span>
        ),
    },
    {
        accessorKey: 'platform_fee',
        header: () => <DataTableStaticHeader title="Platform Fee" />,
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                ${Number(row.original.platform_fee).toFixed(2)}
            </span>
        ),
    },
    {
        accessorKey: 'net_amount',
        header: () => <DataTableStaticHeader title="Net" />,
        cell: ({ row }) => (
            <span className="font-medium text-foreground">
                ${Number(row.original.net_amount).toFixed(2)}
            </span>
        ),
    },
    {
        accessorKey: 'status',
        header: () => <DataTableStaticHeader title="Status" />,
        cell: ({ row }) => STATUS_BADGE[row.original.status] ?? <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
        id: 'invoice',
        header: () => <DataTableStaticHeader title="Invoice" />,
        cell: ({ row }) => <InvoiceButton transactionId={row.original.id} />,
        size: 60,
    },
];

function InvoiceButton({ transactionId }: { transactionId: string }) {
    const { t } = useTranslation();
    const [downloading, setDownloading] = useState(false);

    const handleClick = async () => {
        setDownloading(true);
        try {
            await billingApi.downloadInvoice(transactionId);
        } catch {
            toast.error(t('seller.billing.invoice_unavailable', 'Invoice not available for this transaction.'));
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClick}
            disabled={downloading}
            title={t('seller.billing.download_invoice', 'Download Invoice')}
        >
            {downloading
                ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                : <Download className="h-4 w-4 text-muted-foreground" />
            }
        </Button>
    );
}

export function BillingHistoryTable() {
    const { t } = useTranslation();
    const [data, setData] = useState<BillingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await billingApi.getHistory(
                pagination.pageIndex + 1,
                pagination.pageSize,
                searchQuery || undefined,
                statusFilter,
            );
            setData(result.data);
            setPageCount(result.pagination.totalPages);
        } catch (err) {
            console.error('Failed to fetch billing history:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.pageIndex, pagination.pageSize, searchQuery, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                        setStatusFilter(val);
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                >
                    <SelectTrigger className="w-[150px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t('common.all_status', 'All Status')}</SelectItem>
                        <SelectItem value="SUCCESS">{t('common.success', 'Success')}</SelectItem>
                        <SelectItem value="PENDING">{t('common.pending', 'Pending')}</SelectItem>
                        <SelectItem value="FAILED">{t('common.failed', 'Failed')}</SelectItem>
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
                    onSearchChange={(sq) => {
                        setSearchQuery(sq);
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                    placeholder={t('seller.billing.search_placeholder', 'Search by transaction ID...')}
                    isLoading={loading}
                />
            </div>
        </div>
    );
}
