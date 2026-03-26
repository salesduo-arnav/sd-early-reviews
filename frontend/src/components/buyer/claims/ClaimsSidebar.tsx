import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface ClaimsSidebarProps {
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    sortBy: string;
    onSortChange: (value: string) => void;
    dateRange: DateRange | undefined;
    onDateRangeChange: (value: DateRange | undefined) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

const STATUS_ITEMS = [
    { value: 'ALL', color: 'bg-gray-400' },
    { value: 'ORDER_SUBMITTED', color: 'bg-blue-500' },
    { value: 'REVIEW_PENDING', color: 'bg-orange-500' },
    { value: 'REVIEW_SUBMITTED', color: 'bg-amber-500' },
    { value: 'APPROVED', color: 'bg-green-500' },
    { value: 'REIMBURSED', color: 'bg-emerald-500' },
    { value: 'REJECTED', color: 'bg-red-500' },
];

function SidebarContent({
    statusFilter,
    onStatusFilterChange,
    sortBy,
    onSortChange,
    dateRange,
    onDateRangeChange,
    hasActiveFilters,
    onClearFilters,
}: ClaimsSidebarProps) {
    const { t } = useTranslation();

    const STATUS_LABELS: Record<string, string> = {
        ALL: t('buyer.claims.filter.all', 'All Claims'),
        ORDER_SUBMITTED: t('buyer.claims.filter.order_submitted', 'Order Submitted'),
        REVIEW_PENDING: t('buyer.claims.filter.review_pending', 'Review Pending'),
        REVIEW_SUBMITTED: t('buyer.claims.filter.under_review', 'Under Review'),
        APPROVED: t('buyer.claims.filter.approved', 'Approved'),
        REIMBURSED: t('buyer.claims.filter.reimbursed', 'Reimbursed'),
        REJECTED: t('buyer.claims.filter.rejected', 'Rejected'),
    };

    const SORT_OPTIONS = [
        { value: 'newest', label: t('buyer.claims.sort.newest', 'Newest First') },
        { value: 'oldest', label: t('buyer.claims.sort.oldest', 'Oldest First') },
        { value: 'payout_high', label: t('buyer.claims.sort.payout_high', 'Payout: High to Low') },
        { value: 'payout_low', label: t('buyer.claims.sort.payout_low', 'Payout: Low to High') },
        { value: 'deadline', label: t('buyer.claims.sort.deadline', 'Deadline (Soonest)') },
    ];

    const activeCount = [
        statusFilter !== 'ALL',
        !!dateRange?.from,
        sortBy !== 'newest',
    ].filter(Boolean).length;

    return (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            {/* Sort */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                    {t('buyer.claims.sort_placeholder', 'Sort by')}
                </label>
                <Select value={sortBy} onValueChange={onSortChange}>
                    <SelectTrigger className="w-full h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Status filter */}
            <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                    {t('common.status', 'Status')}
                </h3>
                <div className="space-y-0.5">
                    {STATUS_ITEMS.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => onStatusFilterChange(item.value)}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left',
                                statusFilter === item.value
                                    ? 'bg-brand-primary/10 text-brand-dark font-medium'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', item.color)} />
                            {STATUS_LABELS[item.value]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Date range */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                    {t('common.date', 'Date')}
                </label>
                <DatePickerWithRange
                    value={dateRange}
                    onChange={onDateRangeChange}
                    placeholder={t('buyer.claims.date_range_placeholder', 'Filter by date range')}
                    numberOfMonths={1}
                    className="w-full [&>button]:w-full [&>button]:text-xs"
                />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
                <>
                    <div className="border-t border-border/50" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={onClearFilters}
                    >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        {t('common.clear', 'Clear')}
                        {activeCount > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                                {activeCount}
                            </Badge>
                        )}
                    </Button>
                </>
            )}
        </div>
    );
}

/** Desktop sticky sidebar */
export function ClaimsSidebar(props: ClaimsSidebarProps) {
    return (
        <aside className="hidden md:block w-[240px] flex-shrink-0">
            <div className="sticky top-24">
                <SidebarContent {...props} />
            </div>
        </aside>
    );
}

/** Mobile filter button + sheet */
export function ClaimsMobileFilter(props: ClaimsSidebarProps) {
    const { t } = useTranslation();
    const activeCount = [
        props.statusFilter !== 'ALL',
        !!props.dateRange?.from,
        props.sortBy !== 'newest',
    ].filter(Boolean).length;

    return (
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="relative h-9 w-9 flex-shrink-0">
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-primary text-[10px] text-white flex items-center justify-center">
                                {activeCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[340px]">
                    <SheetHeader>
                        <SheetTitle>{t('buyer.claims.filter_title', 'Filters')}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                        <SidebarContent {...props} />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
