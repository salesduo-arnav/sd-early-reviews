import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { User, Building2, Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi } from '@/api/admin';
import { format } from 'date-fns';
import { SellerDetailModal } from './SellerDetailModal';

interface SellerRowUser { full_name: string; email: string; created_at: string; }
interface SellerRow { id: string; User?: SellerRowUser; company_name?: string; }

export function SellersTable() {
    const [data, setData] = useState<SellerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [detailModal, setDetailModal] = useState<{ open: boolean; sellerId: string }>({ open: false, sellerId: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await adminApi.getSellers(pagination.pageIndex + 1, pagination.pageSize, searchQuery || undefined);
            setData(result.data);
            setPageCount(result.pagination.totalPages);
        } catch (err) { console.error('Failed to fetch data:', err); } finally { setLoading(false); }
    }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const columns = useMemo<ColumnDef<SellerRow, unknown>[]>(() => [
        {
            accessorKey: 'name',
            header: () => <DataTableStaticHeader title="Seller" />,
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
            accessorKey: 'company_name',
            header: () => <DataTableStaticHeader title="Company" />,
            cell: ({ row }) => row.original.company_name ? (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{row.original.company_name}</span>
                </div>
            ) : <span className="text-muted-foreground">—</span>,
        },
        {
            accessorKey: 'joined',
            header: () => <DataTableStaticHeader title="Joined" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.User?.created_at ? format(new Date(row.original.User.created_at), 'MMM d, yyyy') : '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <DataTableStaticHeader title="Actions" srOnly />,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setDetailModal({ open: true, sellerId: row.original.id })}
                    >
                        <Eye className="h-4 w-4" />
                        Details
                    </Button>
                </div>
            ),
        },
    ], []);

    return (
        <>
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
                    placeholder="Search by name, email, or company..."
                    isLoading={loading}
                />
            </div>

            <SellerDetailModal
                open={detailModal.open}
                onOpenChange={(open) => { if (!open) setDetailModal({ open: false, sellerId: '' }); }}
                sellerId={detailModal.sellerId}
            />
        </>
    );
}
