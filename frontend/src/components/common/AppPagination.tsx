import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface AppPaginationProps {
    pagination: PaginationMeta;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

/**
 * Reusable pagination control built on top of the shadcn Pagination primitives.
 * Shows "X–Y of N results", page numbers with ellipsis, and prev/next buttons.
 */
export function AppPagination({ pagination, onPageChange, isLoading }: AppPaginationProps) {
    const { page, totalPages, hasNext, hasPrev, total, limit } = pagination;

    if (totalPages <= 1) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    const getPages = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        if (page > 3) pages.push('...');
        for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 select-none">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{from}–{to}</span> of <span className="font-medium">{total}</span> results
            </p>
            <Pagination className="w-auto mx-0">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={hasPrev && !isLoading ? () => onPageChange(page - 1) : undefined}
                            aria-disabled={!hasPrev || isLoading}
                            className={!hasPrev || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>

                    {getPages().map((p, i) =>
                        p === '...' ? (
                            <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={p}>
                                <PaginationLink
                                    isActive={p === page}
                                    onClick={!isLoading ? () => onPageChange(p as number) : undefined}
                                    className={isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        )
                    )}

                    <PaginationItem>
                        <PaginationNext
                            onClick={hasNext && !isLoading ? () => onPageChange(page + 1) : undefined}
                            aria-disabled={!hasNext || isLoading}
                            className={!hasNext || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
