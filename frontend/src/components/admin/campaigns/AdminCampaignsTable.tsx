import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CirclePause, CirclePlay, Package, Eye } from 'lucide-react';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi } from '@/api/admin';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatPrice, REGION_DISPLAY_NAMES } from '@/lib/regions';
import { CampaignDetailModal } from './CampaignDetailModal';

const statusBadge = (status: string) => {
    switch (status) {
        case 'ACTIVE': return <Badge variant="default" className="capitalize">Active</Badge>;
        case 'PAUSED': return <Badge variant="secondary" className="capitalize">Paused</Badge>;
        case 'COMPLETED': return <Badge variant="outline" className="capitalize">Completed</Badge>;
        default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
};

export function AdminCampaignsTable() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [detailModal, setDetailModal] = useState<{ open: boolean; campaignId: string }>({ open: false, campaignId: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await adminApi.getCampaigns(pagination.pageIndex + 1, pagination.pageSize, searchQuery || undefined, statusFilter);
            setData(result.data);
            setPageCount(result.pagination.totalPages);
        } catch { /* empty */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [pagination.pageIndex, pagination.pageSize, searchQuery, statusFilter]);

    const handleToggleStatus = async (campaignId: string) => {
        setActionLoading(campaignId);
        try {
            await adminApi.toggleCampaignStatus(campaignId);
            toast.success('Campaign status updated');
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        finally { setActionLoading(null); }
    };

    const columns = useMemo<ColumnDef<any, unknown>[]>(() => [
        {
            accessorKey: 'product',
            header: () => <DataTableStaticHeader title="Product" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50 overflow-hidden flex-shrink-0">
                        {row.original.product_image_url
                            ? <img src={row.original.product_image_url} alt="" className="h-9 w-9 object-cover" />
                            : <Package className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                        <p className="max-w-[180px] truncate font-medium text-foreground">{row.original.product_title}</p>
                        <p className="text-sm text-muted-foreground font-mono">{row.original.asin}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'seller',
            header: () => <DataTableStaticHeader title="Seller" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.SellerProfile?.company_name || row.original.SellerProfile?.User?.full_name || '—'}</span>
            ),
        },
        {
            accessorKey: 'region',
            header: () => <DataTableStaticHeader title="Region" />,
            cell: ({ row }) => <span className="text-muted-foreground">{REGION_DISPLAY_NAMES[row.original.region] || row.original.region}</span>,
        },
        {
            accessorKey: 'status',
            header: () => <DataTableStaticHeader title="Status" />,
            cell: ({ row }) => statusBadge(row.original.status),
        },
        {
            accessorKey: 'reviews',
            header: () => <DataTableStaticHeader title="Reviews" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{row.original.completed_reviews ?? 0}</span>
                    {' / '}
                    {row.original.target_reviews}
                </span>
            ),
        },
        {
            accessorKey: 'product_price',
            header: () => <DataTableStaticHeader title="Price" />,
            cell: ({ row }) => <span className="font-medium text-foreground">{formatPrice(parseFloat(row.original.product_price), row.original.region)}</span>,
        },
        {
            accessorKey: 'reimbursement_percent',
            header: () => <DataTableStaticHeader title="Reimb. %" />,
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.reimbursement_percent}%</span>,
        },
        {
            accessorKey: 'created_at',
            header: () => <DataTableStaticHeader title="Created" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {format(new Date(row.original.created_at), 'MMM d, yyyy')}
                </span>
            ),
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
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={() => setDetailModal({ open: true, campaignId: row.original.id })}
                                className="cursor-pointer"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            {row.original.status !== 'COMPLETED' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleToggleStatus(row.original.id)}
                                        disabled={actionLoading === row.original.id}
                                        className="cursor-pointer"
                                    >
                                        {row.original.status === 'ACTIVE'
                                            ? <><CirclePause className="h-4 w-4 mr-2" /> Pause Campaign</>
                                            : <><CirclePlay className="h-4 w-4 mr-2" /> Resume Campaign</>}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [actionLoading]);

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
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
                    onSearchChange={(sq) => { setSearchQuery(sq); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                    placeholder="Search by title, ASIN, seller, or company..."
                    isLoading={loading}
                />
            </div>

            <CampaignDetailModal
                open={detailModal.open}
                onOpenChange={(open) => { if (!open) setDetailModal({ open: false, campaignId: '' }); }}
                campaignId={detailModal.campaignId}
            />
        </div>
    );
}
