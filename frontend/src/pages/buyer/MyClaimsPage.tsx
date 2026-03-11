import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { buyerApi } from '@/api/buyer';
import type { BuyerClaim } from '@/api/buyer';
import type { PaginationMeta } from '@/components/common/AppPagination';
import { AppPagination } from '@/components/common/AppPagination';
import { ClaimCard } from '@/components/buyer/claims/ClaimCard';
import { ClaimDetailModal } from '@/components/buyer/claims/ClaimDetailModal';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Package, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export default function MyClaimsPage() {
    const { t } = useTranslation();

    const STATUS_TABS = [
        { value: 'ALL', label: t('buyer.claims.filter.all', 'All Claims') },
        { value: 'ORDER_SUBMITTED', label: t('buyer.claims.filter.order_submitted', 'Order Submitted') },
        { value: 'REVIEW_PENDING', label: t('buyer.claims.filter.review_pending', 'Review Pending') },
        { value: 'REVIEW_SUBMITTED', label: t('buyer.claims.filter.under_review', 'Under Review') },
        { value: 'APPROVED', label: t('buyer.claims.filter.approved', 'Approved') },
        { value: 'REIMBURSED', label: t('buyer.claims.filter.reimbursed', 'Reimbursed') },
        { value: 'REJECTED', label: t('buyer.claims.filter.rejected', 'Rejected') },
    ];

    const SORT_OPTIONS = [
        { value: 'newest', label: t('buyer.claims.sort.newest', 'Newest First') },
        { value: 'oldest', label: t('buyer.claims.sort.oldest', 'Oldest First') },
        { value: 'payout_high', label: t('buyer.claims.sort.payout_high', 'Payout: High to Low') },
        { value: 'payout_low', label: t('buyer.claims.sort.payout_low', 'Payout: Low to High') },
        { value: 'deadline', label: t('buyer.claims.sort.deadline', 'Deadline (Soonest)') },
    ];

    const [claims, setClaims] = useState<BuyerClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 400);
    const [selectedClaim, setSelectedClaim] = useState<BuyerClaim | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [sortBy, setSortBy] = useState<string>('newest');

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        try {
            const res = await buyerApi.getMyClaims({
                page: currentPage,
                limit: 10,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                search: debouncedSearch || undefined,
                startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                sort: sortBy as 'newest' | 'oldest' | 'payout_high' | 'payout_low' | 'deadline',
            });
            setClaims(res.data);
            setPagination(res.pagination);
        } catch (err) {
            console.error('Failed to fetch claims', err);
            setClaims([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter, debouncedSearch, dateRange, sortBy]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearch, dateRange, sortBy]);

    const handleViewDetails = (claim: BuyerClaim) => {
        setSelectedClaim(claim);
        setDetailOpen(true);
    };

    const handleUploadReview = (claim: BuyerClaim) => {
        setSelectedClaim(claim);
        setDetailOpen(true);
    };

    const handleRefresh = () => {
        fetchClaims();
    };

    const hasActiveFilters = statusFilter !== 'ALL' || debouncedSearch || dateRange?.from || sortBy !== 'newest';

    const clearAllFilters = () => {
        setStatusFilter('ALL');
        setSearchInput('');
        setDateRange(undefined);
        setSortBy('newest');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('buyer.claims.title', 'My Claims')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('buyer.claims.subtitle', 'Track your claimed products, upload review proof, and monitor reimbursement status.')}
                </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {STATUS_TABS.map((tab) => (
                    <Button
                        key={tab.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusFilter(tab.value)}
                        className={cn(
                            'h-8 px-3 text-xs font-medium whitespace-nowrap flex-shrink-0',
                            statusFilter === tab.value
                                ? 'border border-brand-primary/50 bg-brand-primary/10 text-brand-dark font-semibold'
                                : 'text-muted-foreground',
                        )}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* Search + Date Range + Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('buyer.claims.search_placeholder', 'Search by product, ASIN, or order ID...')}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* Date Range */}
                <DatePickerWithRange
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder={t('buyer.claims.date_range_placeholder', 'Filter by date range')}
                    numberOfMonths={1}
                    className="w-full sm:w-auto"
                />

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm">
                        <SelectValue placeholder={t('buyer.claims.sort_placeholder', 'Sort by')} />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-9 px-2.5 text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">{t('common.clear', 'Clear')}</span>
                    </Button>
                )}
            </div>

            {/* Claims Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="shadow-sm border-border">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex gap-3">
                                    <Skeleton className="w-16 h-16 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <Skeleton className="h-3 w-1/3" />
                                <Skeleton className="h-8 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : claims.length === 0 ? (
                <Card className="shadow-sm border-border">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            {hasActiveFilters ? (
                                <Filter className="w-7 h-7 text-muted-foreground" />
                            ) : (
                                <Package className="w-7 h-7 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold">
                            {hasActiveFilters
                                ? t('buyer.claims.no_claims_filter', 'No claims match this filter')
                                : t('buyer.claims.no_claims', 'No claims yet')
                            }
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            {hasActiveFilters
                                ? t('buyer.claims.try_different_filter', 'Try a different filter or search term.')
                                : t('buyer.claims.browse_marketplace', 'Browse the marketplace to find products and start earning reimbursements.')
                            }
                        </p>
                        {!hasActiveFilters && (
                            <Button variant="default" size="sm" className="mt-4" asChild>
                                <a href="/buyer/marketplace">
                                    {t('buyer.claims.go_to_marketplace', 'Browse Marketplace')}
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {claims.map((claim) => (
                            <ClaimCard
                                key={claim.id}
                                claim={claim}
                                onViewDetails={handleViewDetails}
                                onUploadReview={handleUploadReview}
                                onCancelled={handleRefresh}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && (
                        <AppPagination
                            pagination={pagination}
                            onPageChange={setCurrentPage}
                            isLoading={loading}
                        />
                    )}
                </>
            )}

            {/* Detail Modal */}
            <ClaimDetailModal
                claim={selectedClaim}
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open);
                    if (!open) setSelectedClaim(null);
                }}
                onReviewSubmitted={handleRefresh}
                onClaimCancelled={handleRefresh}
            />
        </div>
    );
}
