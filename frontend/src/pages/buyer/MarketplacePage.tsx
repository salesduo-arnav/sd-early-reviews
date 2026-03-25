import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageSearch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AppPagination } from '@/components/common/AppPagination';
import { MarketplaceProductCard } from '@/components/buyer/marketplace/MarketplaceProductCard';
import { MarketplaceFilters } from '@/components/buyer/marketplace/MarketplaceFilters';
import { MarketplaceSidebar } from '@/components/buyer/marketplace/MarketplaceSidebar';
import { buyerApi } from '@/api/buyer';
import type { MarketplaceProduct, MarketplaceQueryParams, MarketplaceFilters as FilterOptions } from '@/api/buyer';
import type { PaginationMeta } from '@/components/common/AppPagination';
const DEFAULT_FILTERS: MarketplaceQueryParams = {
    page: 1,
    limit: 12,
    sort: 'newest',
};

function ProductCardSkeleton() {
    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-full mt-2" />
            </div>
        </div>
    );
}

export default function MarketplacePage() {
    const { t } = useTranslation();

    const [products, setProducts] = useState<MarketplaceProduct[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filters are the "draft" state — only applied on explicit action
    const [filters, setFilters] = useState<MarketplaceQueryParams>(DEFAULT_FILTERS);
    const [searchValue, setSearchValue] = useState('');
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ categories: [], regions: [] });

    // The "applied" params that are actually used for fetching
    const [appliedParams, setAppliedParams] = useState<MarketplaceQueryParams & { search?: string }>(DEFAULT_FILTERS);
    const isInitialMount = useRef(true);

    // Fetch filter options on mount + auto-select buyer's profile region
    useEffect(() => {
        Promise.all([buyerApi.getFilters(), buyerApi.getAccountProfile()])
            .then(([opts, profile]) => {
                setFilterOptions(opts);
                const buyerRegion = profile.region;
                if (buyerRegion && opts.regions.includes(buyerRegion)) {
                    setFilters((prev) => ({ ...prev, region: buyerRegion }));
                    setAppliedParams((prev) => ({ ...prev, region: buyerRegion }));
                }
            })
            .catch(() => {});
    }, []);

    // Fetch products only when appliedParams change
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await buyerApi.getMarketplaceProducts(appliedParams);
            setProducts(result.data);
            setPagination(result.pagination);
        } catch {
            setProducts([]);
            setPagination(null);
        } finally {
            setIsLoading(false);
        }
    }, [appliedParams]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Apply filters + search (triggered by button click or Enter)
    const handleApplySearch = useCallback(() => {
        setFilters((currentFilters) => {
            setSearchValue((currentSearch) => {
                setAppliedParams({
                    ...currentFilters,
                    search: currentSearch || undefined,
                    page: 1,
                });
                return currentSearch;
            });
            return { ...currentFilters, page: 1 };
        });
    }, []);

    // On initial mount, do an initial fetch
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            handleApplySearch();
        }
    }, [handleApplySearch]);

    const handleFilterChange = useCallback((updates: Partial<MarketplaceQueryParams>) => {
        setFilters((prev) => ({ ...prev, ...updates }));
    }, []);

    const handleReset = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setSearchValue('');
        setAppliedParams({ ...DEFAULT_FILTERS });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, page }));
        setAppliedParams((prev) => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t('buyer.marketplace.title', 'Marketplace')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('buyer.marketplace.subtitle', 'Browse available products, claim deals, and start earning reimbursements.')}
                </p>
            </div>

            {/* Main layout: sidebar + content */}
            <div className="flex gap-6">
                {/* Left column: sort + filters sidebar (desktop only) */}
                <MarketplaceSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                    onApply={handleApplySearch}
                    availableCategories={filterOptions.categories}
                    availableRegions={filterOptions.regions}
                />

                {/* Right column: search bar + grid */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Search + mobile filters */}
                    <MarketplaceFilters
                        filters={filters}
                        appliedParams={appliedParams}
                        onFilterChange={handleFilterChange}
                        onReset={handleReset}
                        onApply={handleApplySearch}
                        availableCategories={filterOptions.categories}
                        availableRegions={filterOptions.regions}
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                    />

                    {/* Result count */}
                    {!isLoading && pagination && (
                        <p className="text-sm text-muted-foreground">
                            {pagination.total === 0
                                ? t('buyer.marketplace.no_results', 'No products found matching your criteria.')
                                : t('buyer.marketplace.result_count', '{{count}} products available', {
                                      count: pagination.total,
                                  })}
                        </p>
                    )}

                    {/* Product grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <PackageSearch className="h-16 w-16 mb-4 opacity-40" />
                            <h3 className="text-lg font-semibold">
                                {t('buyer.marketplace.empty_title', 'No Products Found')}
                            </h3>
                            <p className="text-sm mt-1 text-center max-w-md">
                                {t(
                                    'buyer.marketplace.empty_description',
                                    'Try adjusting your search or filters to find available products.',
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map((product) => (
                                <MarketplaceProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <AppPagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
