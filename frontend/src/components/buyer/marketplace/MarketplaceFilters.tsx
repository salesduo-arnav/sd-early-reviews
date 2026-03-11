import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { MarketplaceQueryParams } from '@/api/buyer';
import { REGION_DISPLAY_NAMES } from '@/lib/regions';

interface MarketplaceFiltersProps {
    filters: MarketplaceQueryParams;
    appliedParams: MarketplaceQueryParams & { search?: string };
    onFilterChange: (updates: Partial<MarketplaceQueryParams>) => void;
    onReset: () => void;
    onApply: () => void;
    availableCategories: string[];
    availableRegions: string[];
    searchValue: string;
    onSearchChange: (value: string) => void;
}

const SORT_OPTIONS = [
    { value: 'newest', labelKey: 'buyer.marketplace.sort_newest' },
    { value: 'reimbursement', labelKey: 'buyer.marketplace.sort_reimbursement' },
    { value: 'popular', labelKey: 'buyer.marketplace.sort_popular' },
    { value: 'price_low', labelKey: 'buyer.marketplace.sort_price_low' },
    { value: 'price_high', labelKey: 'buyer.marketplace.sort_price_high' },
] as const;

/** Mobile-only filter controls rendered inside a Sheet */
function MobileFilterControls({
    filters,
    onFilterChange,
    onReset,
    onApply,
    availableCategories,
    availableRegions,
}: Pick<MarketplaceFiltersProps, 'filters' | 'onFilterChange' | 'onReset' | 'onApply' | 'availableCategories' | 'availableRegions'>) {
    const { t } = useTranslation();

    const [localMinPrice, setLocalMinPrice] = useState(
        filters.min_price != null ? String(filters.min_price) : ''
    );
    const [localMaxPrice, setLocalMaxPrice] = useState(
        filters.max_price != null ? String(filters.max_price) : ''
    );

    React.useEffect(() => {
        setLocalMinPrice(filters.min_price != null ? String(filters.min_price) : '');
        setLocalMaxPrice(filters.max_price != null ? String(filters.max_price) : '');
    }, [filters.min_price, filters.max_price]);

    const commitPriceMin = () => {
        onFilterChange({ min_price: localMinPrice ? Number(localMinPrice) : undefined });
    };
    const commitPriceMax = () => {
        onFilterChange({ max_price: localMaxPrice ? Number(localMaxPrice) : undefined });
    };

    const activeFilterCount = [
        filters.category,
        filters.region,
        filters.min_price,
        filters.max_price,
        filters.min_reimbursement,
        filters.max_reimbursement,
    ].filter(Boolean).length;

    return (
        <div className="space-y-5">
            {/* Sort */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('buyer.marketplace.sort', 'Sort By')}</label>
                <Select
                    value={filters.sort || 'newest'}
                    onValueChange={(v) => {
                        onFilterChange({ sort: v as MarketplaceQueryParams['sort'] });
                        setTimeout(onApply, 0);
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {t(opt.labelKey, opt.value)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('buyer.marketplace.category', 'Category')}</label>
                <Select
                    value={filters.category || '_all'}
                    onValueChange={(v) => onFilterChange({ category: v === '_all' ? undefined : v })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('buyer.marketplace.all_categories', 'All Categories')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">{t('buyer.marketplace.all_categories', 'All Categories')}</SelectItem>
                        {availableCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Region */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('buyer.marketplace.region', 'Region')}</label>
                <Select
                    value={filters.region || '_all'}
                    onValueChange={(v) => onFilterChange({ region: v === '_all' ? undefined : v })}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('buyer.marketplace.all_regions', 'All Regions')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">{t('buyer.marketplace.all_regions', 'All Regions')}</SelectItem>
                        {availableRegions.map((reg) => (
                            <SelectItem key={reg} value={reg}>
                                {REGION_DISPLAY_NAMES[reg] || reg}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Reimbursement % */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">
                    {t('buyer.marketplace.reimbursement_range', 'Reimbursement %')}
                </label>
                <div className="px-1 pt-1">
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[filters.min_reimbursement ?? 0, filters.max_reimbursement ?? 100]}
                        onValueChange={([min, max]) =>
                            onFilterChange({
                                min_reimbursement: min === 0 ? undefined : min,
                                max_reimbursement: max === 100 ? undefined : max,
                            })
                        }
                    />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{filters.min_reimbursement ?? 0}%</span>
                    <span>{filters.max_reimbursement ?? 100}%</span>
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('buyer.marketplace.price_range', 'Price Range')}</label>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        min={0}
                        placeholder={t('buyer.marketplace.min', 'Min')}
                        value={localMinPrice}
                        onChange={(e) => setLocalMinPrice(e.target.value)}
                        onBlur={commitPriceMin}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitPriceMin(); }}
                        className="w-full"
                    />
                    <Input
                        type="number"
                        min={0}
                        placeholder={t('buyer.marketplace.max', 'Max')}
                        value={localMaxPrice}
                        onChange={(e) => setLocalMaxPrice(e.target.value)}
                        onBlur={commitPriceMax}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitPriceMax(); }}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Apply */}
            <Button className="w-full" size="sm" onClick={onApply}>
                <Search className="h-3.5 w-3.5 mr-1.5" />
                {t('buyer.marketplace.apply_filters', 'Apply Filters')}
            </Button>

            {/* Reset */}
            {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onReset}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    {t('buyer.marketplace.clear_filters', 'Clear Filters')}
                    <Badge variant="secondary" className="ml-2 text-xs">
                        {activeFilterCount}
                    </Badge>
                </Button>
            )}
        </div>
    );
}

export function MarketplaceFilters({
    filters,
    appliedParams,
    onFilterChange,
    onReset,
    onApply,
    availableCategories,
    availableRegions,
    searchValue,
    onSearchChange,
}: MarketplaceFiltersProps) {
    const { t } = useTranslation();

    const activeFilterCount = [
        filters.category,
        filters.region,
        filters.min_price,
        filters.max_price,
        filters.min_reimbursement,
        filters.max_reimbursement,
    ].filter(Boolean).length;

    // Pills reflect appliedParams — only change after Apply is clicked
    const appliedFilterCount = [
        appliedParams.category,
        appliedParams.region,
        appliedParams.min_price,
        appliedParams.max_price,
        appliedParams.min_reimbursement,
        appliedParams.max_reimbursement,
    ].filter(Boolean).length;

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onApply();
        }
    };

    return (
        <div className="space-y-4">
            {/* Search bar + mobile filter trigger */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t('buyer.marketplace.search_label', 'Search')}
                </label>
                <div className="flex gap-3">
                {/* Search + button */}
                <div className="relative flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('buyer.marketplace.search_placeholder', 'Search by product name or ASIN...')}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={onApply} size="default">
                        <Search className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('buyer.marketplace.search_btn', 'Search')}</span>
                    </Button>
                </div>

                {/* Mobile filter sheet trigger */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="relative h-10 w-10">
                                <SlidersHorizontal className="h-4 w-4" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-primary text-[10px] text-white flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[340px]">
                            <SheetHeader>
                                <SheetTitle>{t('buyer.marketplace.filters', 'Filters')}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <MobileFilterControls
                                    filters={filters}
                                    onFilterChange={onFilterChange}
                                    onReset={onReset}
                                    onApply={onApply}
                                    availableCategories={availableCategories}
                                    availableRegions={availableRegions}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            </div>

            {/* Active filter pills — reflect appliedParams only (not draft filters) */}
            {appliedFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {appliedParams.category && (
                        <Badge variant="secondary" className="gap-1">
                            {appliedParams.category}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    onFilterChange({ category: undefined });
                                    setTimeout(onApply, 0);
                                }}
                            />
                        </Badge>
                    )}
                    {appliedParams.region && (
                        <Badge variant="secondary" className="gap-1">
                            {REGION_DISPLAY_NAMES[appliedParams.region] || appliedParams.region}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    onFilterChange({ region: undefined });
                                    setTimeout(onApply, 0);
                                }}
                            />
                        </Badge>
                    )}
                    {(appliedParams.min_price || appliedParams.max_price) && (
                        <Badge variant="secondary" className="gap-1">
                            ${appliedParams.min_price ?? 0} &ndash; ${appliedParams.max_price ?? '∞'}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    onFilterChange({ min_price: undefined, max_price: undefined });
                                    setTimeout(onApply, 0);
                                }}
                            />
                        </Badge>
                    )}
                    {(appliedParams.min_reimbursement || appliedParams.max_reimbursement) && (
                        <Badge variant="secondary" className="gap-1">
                            {appliedParams.min_reimbursement ?? 0}% &ndash; {appliedParams.max_reimbursement ?? 100}%
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                    onFilterChange({ min_reimbursement: undefined, max_reimbursement: undefined });
                                    setTimeout(onApply, 0);
                                }}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
