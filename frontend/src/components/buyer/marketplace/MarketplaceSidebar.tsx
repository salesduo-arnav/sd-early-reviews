import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { MarketplaceQueryParams } from '@/api/buyer';
import { REGION_DISPLAY_NAMES } from '@/lib/regions';

const SORT_OPTIONS = [
    { value: 'newest', labelKey: 'buyer.marketplace.sort_newest' },
    { value: 'reimbursement', labelKey: 'buyer.marketplace.sort_reimbursement' },
    { value: 'popular', labelKey: 'buyer.marketplace.sort_popular' },
    { value: 'price_low', labelKey: 'buyer.marketplace.sort_price_low' },
    { value: 'price_high', labelKey: 'buyer.marketplace.sort_price_high' },
] as const;

interface MarketplaceSidebarProps {
    filters: MarketplaceQueryParams;
    onFilterChange: (updates: Partial<MarketplaceQueryParams>) => void;
    onReset: () => void;
    onApply: () => void;
    availableCategories: string[];
    availableRegions: string[];
}

export function MarketplaceSidebar({
    filters,
    onFilterChange,
    onReset,
    onApply,
    availableCategories,
    availableRegions,
}: MarketplaceSidebarProps) {
    const { t } = useTranslation();

    // Local state for price inputs to prevent defocus on every keystroke
    const [localMinPrice, setLocalMinPrice] = useState<string>(
        filters.min_price != null ? String(filters.min_price) : ''
    );
    const [localMaxPrice, setLocalMaxPrice] = useState<string>(
        filters.max_price != null ? String(filters.max_price) : ''
    );

    // Sync local price state when filters are reset externally
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
        <aside className="hidden md:flex flex-col gap-4 w-[260px] flex-shrink-0">
            {/* Sort dropdown — outside the filter card, same width */}
            <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t('buyer.marketplace.sort', 'Sort By')}
                </label>
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

            {/* Filters card */}
            <div className="sticky top-24 space-y-5 p-4 rounded-lg border border-border bg-card">
                <h3 className="text-sm font-semibold">{t('buyer.marketplace.filters', 'Filters')}</h3>

                {/* Category */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        {t('buyer.marketplace.category', 'Category')}
                    </label>
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
                    <label className="text-xs font-medium text-muted-foreground">
                        {t('buyer.marketplace.region', 'Region')}
                    </label>
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
                    <label className="text-xs font-medium text-muted-foreground">
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

                {/* Price Range — local state, committed on blur */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        {t('buyer.marketplace.price_range', 'Price Range')}
                    </label>
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

                {/* Apply button */}
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
        </aside>
    );
}
