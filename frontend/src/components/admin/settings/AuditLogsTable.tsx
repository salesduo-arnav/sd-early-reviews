import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, User, X, ScrollText } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableStaticHeader } from '@/components/ui/data-table';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { adminApi, type AuditLogRow } from '@/api/admin';
import { format } from 'date-fns';
import { useAdminTable } from '@/hooks/use-admin-table';

// Helpers

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

// Main Component

export function AuditLogsTable() {
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [detailModal, setDetailModal] = useState<{ open: boolean; log: AuditLogRow | null }>({ open: false, log: null });

    const hasDateFilter = startDate !== undefined || endDate !== undefined;

    const clearDateFilters = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const fetchFn = useCallback(
        (page: number, size: number, search: string | undefined) => {
            const startStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
            const endStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
            return adminApi.getAuditLogs(page, size, search, startStr, endStr);
        },
        [startDate, endDate],
    );

    const { data, loading, pagination, setPagination, pageCount, searchQuery, setSearchQuery } = useAdminTable<AuditLogRow>({ fetchFn, defaultPageSize: 20 });

    const columns = useMemo<ColumnDef<AuditLogRow, unknown>[]>(() => [
        {
            accessorKey: 'admin',
            header: () => <DataTableStaticHeader title="Admin" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/50">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{row.original.User?.full_name || '\u2014'}</p>
                        <p className="text-sm text-muted-foreground truncate">{row.original.User?.email}</p>
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
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.target_type || '\u2014'}</span>,
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
        <Card className="border shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ScrollText className="w-4 h-4 text-muted-foreground" />
                            Audit Logs
                        </CardTitle>
                        <CardDescription>Track all administrative actions performed on the platform.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Date Filters */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground me-3">From</Label>
                        <DateTimePicker
                            value={startDate}
                            onChange={(date) => { setStartDate(date); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                            placeholder="Start date"
                            timeFormat="24h"
                            minuteInterval={15}
                            className="h-9 w-[180px]"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground me-3">To</Label>
                        <DateTimePicker
                            value={endDate}
                            onChange={(date) => { setEndDate(date); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                            placeholder="End date"
                            timeFormat="24h"
                            minuteInterval={15}
                            className="h-9 w-[180px]"
                        />
                    </div>
                    {hasDateFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-muted-foreground hover:text-foreground"
                            onClick={clearDateFilters}
                        >
                            <X className="h-3.5 w-3.5 mr-1" /> Clear dates
                        </Button>
                    )}
                </div>

                {/* Data Table */}
                <div className="rounded-xl border bg-card overflow-hidden">
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
                        placeholder="Search by action or admin..."
                        isLoading={loading}
                    />
                </div>
            </CardContent>

            {/* Detail Modal */}
            <Dialog open={detailModal.open} onOpenChange={(open) => { if (!open) setDetailModal({ open: false, log: null }); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <DetailField label="Admin">
                                    <p className="text-sm font-medium">{selectedLog.User?.full_name || '\u2014'}</p>
                                    <p className="text-xs text-muted-foreground">{selectedLog.User?.email}</p>
                                </DetailField>
                                <DetailField label="Timestamp">
                                    <p className="text-sm">{format(new Date(selectedLog.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
                                </DetailField>
                            </div>

                            <DetailField label="Action">
                                <div>{actionBadge(selectedLog.action)}</div>
                            </DetailField>

                            <div className="grid grid-cols-2 gap-4">
                                <DetailField label="Target Type">
                                    <p className="text-sm">{selectedLog.target_type || '\u2014'}</p>
                                </DetailField>
                                <DetailField label="Target ID">
                                    <p className="text-sm font-mono break-all">{selectedLog.target_id || '\u2014'}</p>
                                </DetailField>
                            </div>

                            {selectedLog.ip_address && (
                                <DetailField label="IP Address">
                                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                                </DetailField>
                            )}

                            <DetailField label="Details">
                                {formattedDetails ? (
                                    <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                                        {formattedDetails}
                                    </pre>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No additional details</p>
                                )}
                            </DetailField>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// Detail Field

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {children}
        </div>
    );
}
