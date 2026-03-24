import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, Shield, ShieldOff, User, Eye } from 'lucide-react';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { adminApi, type BuyerRow } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { format } from 'date-fns';
import { formatPrice, REGION_DISPLAY_NAMES } from '@/lib/regions';
import { BuyerDetailModal } from './BuyerDetailModal';
import { useAdminTable } from '@/hooks/use-admin-table';

export function BuyersTable() {
    const [blacklistFilter, setBlacklistFilter] = useState('all');
    const [blacklistDialog, setBlacklistDialog] = useState<{ open: boolean; buyerId: string; currentStatus: boolean; buyerName: string }>({ open: false, buyerId: '', currentStatus: false, buyerName: '' });
    const [blacklistReason, setBlacklistReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [detailModal, setDetailModal] = useState<{ open: boolean; buyerId: string }>({ open: false, buyerId: '' });

    const fetchFn = useCallback(
        (page: number, size: number, search: string | undefined) =>
            adminApi.getBuyers(page, size, search, blacklistFilter !== 'all' ? blacklistFilter : undefined),
        [blacklistFilter],
    );

    const { data, loading, pagination, setPagination, pageCount, searchQuery, setSearchQuery, refetch } = useAdminTable<BuyerRow>({ fetchFn });

    const handleToggleBlacklist = async () => {
        setActionLoading(true);
        const newStatus = !blacklistDialog.currentStatus;
        try {
            await adminApi.toggleBlacklist(blacklistDialog.buyerId, newStatus, newStatus ? blacklistReason : undefined);
            toast.success(`Buyer ${newStatus ? 'blacklisted' : 'unblacklisted'}`);
            setBlacklistDialog({ open: false, buyerId: '', currentStatus: false, buyerName: '' });
            setBlacklistReason('');
            refetch();
        } catch (e: unknown) { toast.error(getErrorMessage(e)); }
        finally { setActionLoading(false); }
    };

    const columns = useMemo<ColumnDef<BuyerRow, unknown>[]>(() => [
        {
            accessorKey: 'name',
            header: () => <DataTableStaticHeader title="Buyer" />,
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
            accessorKey: 'region',
            header: () => <DataTableStaticHeader title="Region" />,
            cell: ({ row }) => <span className="text-muted-foreground">{REGION_DISPLAY_NAMES[row.original.region] || row.original.region}</span>,
        },
        {
            accessorKey: 'on_time_submission_rate',
            header: () => <DataTableStaticHeader title="On-Time Rate" />,
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.on_time_submission_rate?.toFixed(0)}%</span>,
        },
        {
            accessorKey: 'total_earnings',
            header: () => <DataTableStaticHeader title="Earnings" />,
            cell: ({ row }) => <span className="font-medium text-foreground">{formatPrice(parseFloat(row.original.total_earnings || '0'), row.original.region || 'com')}</span>,
        },
        {
            accessorKey: 'is_blacklisted',
            header: () => <DataTableStaticHeader title="Status" />,
            cell: ({ row }) => row.original.is_blacklisted
                ? <Badge variant="destructive">Blacklisted</Badge>
                : <Badge variant="default" className="capitalize">Active</Badge>,
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
            cell: ({ row }) => {
                const buyer = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                    onClick={() => setDetailModal({ open: true, buyerId: buyer.id })}
                                    className="cursor-pointer"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {buyer.is_blacklisted ? (
                                    <DropdownMenuItem
                                        onClick={() => setBlacklistDialog({ open: true, buyerId: buyer.id, currentStatus: true, buyerName: buyer.User?.full_name || '' })}
                                        className="cursor-pointer"
                                    >
                                        <ShieldOff className="h-4 w-4 mr-2" />
                                        Unblock Buyer
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => setBlacklistDialog({ open: true, buyerId: buyer.id, currentStatus: false, buyerName: buyer.User?.full_name || '' })}
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Blacklist Buyer
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], []);

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select value={blacklistFilter} onValueChange={(val) => { setBlacklistFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Buyers</SelectItem>
                        <SelectItem value="false">Active</SelectItem>
                        <SelectItem value="true">Blacklisted</SelectItem>
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
                    placeholder="Search by name or email..."
                    isLoading={loading}
                />
            </div>

            <AlertDialog open={blacklistDialog.open} onOpenChange={(open) => { if (!open) { setBlacklistDialog({ open: false, buyerId: '', currentStatus: false, buyerName: '' }); setBlacklistReason(''); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{blacklistDialog.currentStatus ? 'Unblock' : 'Blacklist'} {blacklistDialog.buyerName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {blacklistDialog.currentStatus
                                ? 'This will restore the buyer\'s ability to claim products and submit reviews.'
                                : 'This will prevent the buyer from claiming new products and submitting reviews.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {!blacklistDialog.currentStatus && (
                        <Textarea placeholder="Reason for blacklisting (optional)..." value={blacklistReason} onChange={(e) => setBlacklistReason(e.target.value)} rows={2} />
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleBlacklist} disabled={actionLoading} className={!blacklistDialog.currentStatus ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
                            {blacklistDialog.currentStatus ? 'Unblock' : 'Blacklist'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BuyerDetailModal
                open={detailModal.open}
                onOpenChange={(open) => { if (!open) setDetailModal({ open: false, buyerId: '' }); }}
                buyerId={detailModal.buyerId}
            />
        </div>
    );
}
