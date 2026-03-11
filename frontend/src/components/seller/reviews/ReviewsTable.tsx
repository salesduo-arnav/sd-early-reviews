import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardApi, SellerReview } from '@/api/dashboard/seller';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader, DataTableStaticHeader } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Star, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ReviewDetailsModal } from './ReviewDetailsModal';
import { formatPrice } from '@/lib/regions';

export function ReviewsTable() {
    const { t } = useTranslation();
    const [reviews, setReviews] = useState<SellerReview[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReview, setSelectedReview] = useState<SellerReview | null>(null);

    // Server-side pagination and filtering states
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [ratingFilter, setRatingFilter] = useState('ALL');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const startStr = startDate ? startDate.toISOString() : undefined;
            const endStr = endDate ? endDate.toISOString() : undefined;

            const res = await dashboardApi.getSellerReviews(
                pagination.pageIndex + 1,
                pagination.pageSize,
                searchQuery,
                statusFilter,
                ratingFilter,
                startStr,
                endStr
            );

            setReviews(res.data);
            setPageCount(res.pagination.totalPages);
        } catch (err: unknown) {
            console.error('Failed to fetch reviews', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, searchQuery, statusFilter, ratingFilter, startDate, endDate]);

    const columns = useMemo<ColumnDef<SellerReview, unknown>[]>(() => {
        const getStatusBadge = (status: string) => {
            switch (status) {
                case 'APPROVED':
                    return <Badge className="bg-green-500/10 text-green-700 border-green-200">{t('status.approved', 'Approved')}</Badge>;
                case 'PENDING_VERIFICATION':
                    return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-200">{t('status.pending', 'Pending')}</Badge>;
                case 'REJECTED':
                    return <Badge variant="destructive">{t('status.rejected', 'Rejected')}</Badge>;
                case 'TIMEOUT':
                    return <Badge variant="outline" className="text-gray-500">{t('status.timeout', 'Timeout')}</Badge>;
                default:
                    return <Badge variant="outline">{status}</Badge>;
            }
        };

        return [
        {
            accessorKey: 'review_date',
            size: 110,
            header: () => <DataTableStaticHeader title={t('common.date', 'Date')} />,
            cell: ({ row }) => {
                const val = row.getValue('review_date') as string | null;
                return <div className="text-sm text-foreground/80 whitespace-nowrap">{val ? format(new Date(val), 'MMM d, yyyy') : <span className="text-muted-foreground">—</span>}</div>;
            }
        },
        {
            accessorKey: 'asin',
            size: 120,
            header: () => <DataTableStaticHeader title="ASIN" />,
            cell: ({ row }) => (
                <div className="font-mono text-sm font-medium text-brand-primary" title={row.original.product_title || ''}>
                    {row.getValue('asin')}
                </div>
            )
        },
        {
            accessorKey: 'amazon_order_id',
            size: 200,
            header: () => <DataTableStaticHeader title="Order ID" />,
            cell: ({ row }) => {
                const val = row.getValue('amazon_order_id') as string | null;
                return (
                    <div className="font-mono text-xs text-foreground/80 bg-muted/60 px-2 py-1 rounded border border-border/60 whitespace-nowrap">
                        {val || <span className="text-muted-foreground">—</span>}
                    </div>
                );
            }
        },
        {
            accessorKey: 'review_rating',
            size: 80,
            header: () => <DataTableStaticHeader title={t('common.rating', 'Rating')} />,
            cell: ({ row }) => {
                const rating = row.getValue('review_rating') as number | null;
                if (!rating) return <span className="text-muted-foreground text-sm">—</span>;
                return (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="font-semibold text-md mr-1">{rating}.0</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                );
            }
        },
        {
            accessorKey: 'review_text',
            size: 260,
            header: () => <DataTableStaticHeader title={t('common.review', 'Review')} />,
            cell: ({ row }) => {
                const text = row.getValue('review_text') as string | null;
                return (
                    <p className="text-sm line-clamp-2 leading-relaxed" title={text || ''}>
                        {text || <span className="text-muted-foreground italic">{t('common.no_text', 'No review text')}</span>}
                    </p>
                );
            }
        },
        {
            accessorKey: 'expected_payout_amount',
            size: 90,
            header: () => <DataTableStaticHeader title={t('common.payout', 'Payout')} />,
            cell: ({ row }) => {
                const amount = row.getValue('expected_payout_amount') as number;
                const region = (row.original as SellerReview).region || 'com';
                return (
                    <div className="text-sm font-semibold text-foreground/90 whitespace-nowrap">
                        {formatPrice(Number(amount ?? 0), region)}
                    </div>
                );
            }
        },
        {
            accessorKey: 'review_status',
            size: 120,
            header: () => <DataTableStaticHeader title={t('common.status', 'Status')} />,
            cell: ({ row }) => getStatusBadge(row.getValue('review_status'))
        },
        {
            id: 'actions',
            size: 80,
            header: () => <DataTableStaticHeader title={t('common.actions', 'Actions')} />,
            cell: ({ row }) => (
                <div className="flex justify-start">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReview(row.original)}
                        className="h-8 px-2 text-muted-foreground hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                        <Eye className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium">{t('common.view', 'View')}</span>
                    </Button>
                </div>
            )
        }
    ];
    }, [t]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                        <SelectTrigger className="w-[180px] shrink-0 h-9">
                            <SelectValue placeholder={t('common.status', 'Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('common.all_statuses', 'All Statuses')}</SelectItem>
                            <SelectItem value="PENDING_VERIFICATION">{t('status.pending', 'Pending')}</SelectItem>
                            <SelectItem value="APPROVED">{t('status.approved', 'Approved')}</SelectItem>
                            <SelectItem value="REJECTED">{t('status.rejected', 'Rejected')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={ratingFilter} onValueChange={(val) => { setRatingFilter(val); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}>
                        <SelectTrigger className="w-[150px] shrink-0 h-9">
                            <SelectValue placeholder={t('common.rating', 'Rating')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('common.all_ratings', 'All Ratings')}</SelectItem>
                            <SelectItem value="5">5 {t('common.stars_short', 'Stars')}</SelectItem>
                            <SelectItem value="4">4 {t('common.stars_short', 'Stars')}</SelectItem>
                            <SelectItem value="3">3 {t('common.stars_short', 'Stars')}</SelectItem>
                            <SelectItem value="2">2 {t('common.stars_short', 'Stars')}</SelectItem>
                            <SelectItem value="1">1 {t('common.stars_short', 'Star')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="shrink-0 flex items-center gap-2">
                        <DateTimePicker
                            value={startDate}
                            onChange={(date) => { setStartDate(date); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                            placeholder="Start Date"
                            className="h-9 w-[180px]"
                        />
                        <span className="text-muted-foreground">-</span>
                        <DateTimePicker
                            value={endDate}
                            onChange={(date) => { setEndDate(date); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                            placeholder="End Date"
                            className="h-9 w-[180px]"
                        />
                    </div>
                </div>
            </div>

            <div className="border rounded-md bg-white shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={reviews}
                    pageCount={pageCount}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    sorting={[]}
                    onSortingChange={() => { }}
                    searchQuery={searchQuery}
                    onSearchChange={(sq: string) => { setSearchQuery(sq); setPagination(prev => ({ ...prev, pageIndex: 0 })); }}
                    placeholder={t('seller.reviews.search_placeholder', 'Search by ASIN, Match ID, keywords...')}
                    isLoading={loading}
                />
            </div>

            <ReviewDetailsModal
                review={selectedReview}
                open={!!selectedReview}
                onOpenChange={(open) => {
                    if (!open) setSelectedReview(null);
                }}
            />
        </div>
    );
}
