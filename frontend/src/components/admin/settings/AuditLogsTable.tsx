import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, User } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { adminApi } from '@/api/admin';
import { format } from 'date-fns';

const actionBadge = (action: string) => {
    if (action.includes('APPROVED') || action.includes('PROCESSED') || action.includes('UNBLACKLISTED') || action.includes('RESUMED'))
        return <Badge variant="default" className="whitespace-nowrap capitalize">{action.replace(/_/g, ' ').toLowerCase()}</Badge>;
    if (action.includes('REJECTED') || action.includes('FAILED') || action.includes('BLACKLISTED') || action.includes('DELETED') || action.includes('PAUSED'))
        return <Badge variant="destructive" className="whitespace-nowrap capitalize">{action.replace(/_/g, ' ').toLowerCase()}</Badge>;
    return <Badge variant="secondary" className="whitespace-nowrap capitalize">{action.replace(/_/g, ' ').toLowerCase()}</Badge>;
};

const formatDetails = (details: string | null) => {
    if (!details) return null;
    try {
        const parsed = JSON.parse(details);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return details;
    }
};

interface AuditLogUser { full_name: string; email: string; }
interface AuditLogRow {
    id: string; User?: AuditLogUser; action: string; target_type: string;
    target_id: string; created_at: string; ip_address?: string; details?: string;
}

export function AuditLogsTable() {
    const [data, setData] = useState<AuditLogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
    const [pageCount, setPageCount] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [detailModal, setDetailModal] = useState<{ open: boolean; log: AuditLogRow | null }>({ open: false, log: null });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const startStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
            const endStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
            const result = await adminApi.getAuditLogs(pagination.pageIndex + 1, pagination.pageSize, searchQuery || undefined, startStr, endStr);
            setData(result.data);
            setPageCount(result.pagination.totalPages);
        } catch (err) { console.error('Failed to fetch data:', err); } finally { setLoading(false); }
    }, [pagination.pageIndex, pagination.pageSize, searchQuery, startDate, endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const columns = useMemo<ColumnDef<AuditLogRow, unknown>[]>(() => [
        {
            accessorKey: 'admin',
            header: () => <DataTableStaticHeader title="Admin" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.User?.full_name || '—'}</p>
                        <p className="text-sm text-muted-foreground">{row.original.User?.email}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'action',
            header: () => <DataTableStaticHeader title="Action" />,
            cell: ({ row }) => actionBadge(row.original.action),
        },
        {
            accessorKey: 'target_type',
            header: () => <DataTableStaticHeader title="Target Type" />,
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.target_type || '—'}</span>,
        },
        {
            accessorKey: 'target_id',
            header: () => <DataTableStaticHeader title="Target ID" />,
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground max-w-[120px] truncate block">{row.original.target_id}</span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: () => <DataTableStaticHeader title="Timestamp" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm')}
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
                        className="h-8 w-8 p-0 hover:bg-muted"
                        onClick={() => setDetailModal({ open: true, log: row.original })}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], []);

    const selectedLog = detailModal.log;
    const formattedDetails = selectedLog ? formatDetails(selectedLog.details) : null;

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-end flex-wrap">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground mr-2">From</Label>
                    <DateTimePicker
                        value={startDate}
                        onChange={(date) => { setStartDate(date); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                        placeholder="Start date"
                        timeFormat="24h"
                        minuteInterval={15}
                        className="h-9 w-[180px]"
                    />
                    <Label className="text-xs text-muted-foreground mx-4">To</Label>
                    <DateTimePicker
                        value={endDate}
                        onChange={(date) => { setEndDate(date); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                        placeholder="End date"
                        timeFormat="24h"
                        minuteInterval={15}
                        className="h-9 w-[180px]"
                    />
                </div>
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
                    placeholder="Search by action or admin..."
                    isLoading={loading}
                />
            </div>

            <Dialog open={detailModal.open} onOpenChange={(open) => { if (!open) setDetailModal({ open: false, log: null }); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Admin</p>
                                    <p className="text-sm font-medium">{selectedLog.User?.full_name || '—'}</p>
                                    <p className="text-xs text-muted-foreground">{selectedLog.User?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Timestamp</p>
                                    <p className="text-sm">{format(new Date(selectedLog.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Action</p>
                                <div>{actionBadge(selectedLog.action)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Target Type</p>
                                    <p className="text-sm">{selectedLog.target_type || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Target ID</p>
                                    <p className="text-sm font-mono break-all">{selectedLog.target_id || '—'}</p>
                                </div>
                            </div>

                            {selectedLog.ip_address && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">IP Address</p>
                                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Details</p>
                                {formattedDetails ? (
                                    <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                                        {formattedDetails}
                                    </pre>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No additional details</p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
