import { useCallback, useEffect, useState } from 'react';
import { PaginationState, OnChangeFn } from '@tanstack/react-table';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

interface AdminTableResult<TData> {
    data: TData[];
    pagination: { totalPages: number; total?: number };
}

interface UseAdminTableOptions<TData> {
    fetchFn: (page: number, pageSize: number, search: string | undefined) => Promise<AdminTableResult<TData>>;
    defaultPageSize?: number;
}

interface UseAdminTableReturn<TData> {
    data: TData[];
    loading: boolean;
    pagination: PaginationState;
    setPagination: OnChangeFn<PaginationState>;
    pageCount: number;
    totalCount: number | undefined;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    refetch: () => void;
}

export function useAdminTable<TData>({
    fetchFn,
    defaultPageSize = 10,
}: UseAdminTableOptions<TData>): UseAdminTableReturn<TData> {
    const [data, setData] = useState<TData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: defaultPageSize });
    const [pageCount, setPageCount] = useState(-1);
    const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
    const [searchQuery, setSearchQueryRaw] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchFn(
                pagination.pageIndex + 1,
                pagination.pageSize,
                searchQuery || undefined,
            );
            setData(result.data);
            setPageCount(result.pagination.totalPages);
            setTotalCount(result.pagination.total);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [fetchFn, pagination.pageIndex, pagination.pageSize, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const setSearchQuery = useCallback((q: string) => {
        setSearchQueryRaw(q);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, []);

    return {
        data,
        loading,
        pagination,
        setPagination,
        pageCount,
        totalCount,
        searchQuery,
        setSearchQuery,
        refetch: fetchData,
    };
}
