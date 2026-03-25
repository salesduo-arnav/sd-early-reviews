import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { buyerApi } from '@/api/buyer';
import type { BuyerClaim } from '@/api/buyer';
import type { PaginationMeta } from '@/components/common/AppPagination';
import { AppPagination } from '@/components/common/AppPagination';
import { ClaimCard } from '@/components/buyer/claims/ClaimCard';
import { ClaimDetailModal } from '@/components/buyer/claims/ClaimDetailModal';
import { ClaimsSidebar, ClaimsMobileFilter } from '@/components/buyer/claims/ClaimsSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export default function MyClaimsPage() {
    const { t } = useTranslation();

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
            toast.error(getErrorMessage(err));
            setClaims([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter, debouncedSearch, dateRange, sortBy]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

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

    const hasActiveFilters = statusFilter !== 'ALL' || !!debouncedSearch || !!dateRange?.from || sortBy !== 'newest';

    const clearAllFilters = () => {
        setStatusFilter('ALL');
        setSearchInput('');
        setDateRange(undefined);
        setSortBy('newest');
    };

    const sidebarProps = {
        statusFilter,
        onStatusFilterChange: setStatusFilter,
        sortBy,
        onSortChange: setSortBy,
        dateRange,
        onDateRangeChange: setDateRange,
        hasActiveFilters,
        onClearFilters: clearAllFilters,
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

            {/* Sidebar + Content */}
            <div className="flex gap-6 items-start">
                <ClaimsSidebar {...sidebarProps} />

                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Search bar + mobile filter trigger — aligned with grid */}
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('buyer.claims.search_placeholder', 'Search by product, ASIN, or order ID...')}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <ClaimsMobileFilter {...sidebarProps} />
                    </div>

                    {/* Claims grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Card key={i} className="shadow-sm border-border">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex gap-3">
                                            <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                                            <div className="flex-1 min-w-0 space-y-2">
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
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
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

                            {pagination && (
                                <AppPagination
                                    pagination={pagination}
                                    onPageChange={setCurrentPage}
                                    isLoading={loading}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

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
