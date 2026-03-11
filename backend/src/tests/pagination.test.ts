import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';

describe('parsePaginationParams', () => {
    it('should return defaults when no query params provided', () => {
        const result = parsePaginationParams({});
        expect(result).toEqual({ page: 1, limit: 10, offset: 0 });
    });

    it('should use custom default limit', () => {
        const result = parsePaginationParams({}, 20);
        expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it('should parse page and limit from query', () => {
        const result = parsePaginationParams({ page: '3', limit: '25' });
        expect(result).toEqual({ page: 3, limit: 25, offset: 50 });
    });

    it('should clamp page to minimum of 1', () => {
        const result = parsePaginationParams({ page: '-5' });
        expect(result.page).toBe(1);
        expect(result.offset).toBe(0);
    });

    it('should clamp page to 1 for zero', () => {
        const result = parsePaginationParams({ page: '0' });
        expect(result.page).toBe(1);
    });

    it('should clamp limit to maximum of 100', () => {
        const result = parsePaginationParams({ limit: '500' });
        expect(result.limit).toBe(100);
    });

    it('should fall back to default limit when limit is 0', () => {
        // parseInt('0') is 0 which is falsy, so || defaultLimit kicks in
        const result = parsePaginationParams({ limit: '0' });
        expect(result.limit).toBe(10);
    });

    it('should clamp negative limit to minimum of 1', () => {
        const result = parsePaginationParams({ limit: '-5' });
        expect(result.limit).toBe(1);
    });

    it('should handle non-numeric values gracefully', () => {
        const result = parsePaginationParams({ page: 'abc', limit: 'xyz' });
        expect(result).toEqual({ page: 1, limit: 10, offset: 0 });
    });

    it('should calculate offset correctly for page 2', () => {
        const result = parsePaginationParams({ page: '2', limit: '15' });
        expect(result.offset).toBe(15);
    });

    it('should calculate offset correctly for page 5 with limit 20', () => {
        const result = parsePaginationParams({ page: '5', limit: '20' });
        expect(result.offset).toBe(80);
    });
});

describe('buildPaginatedResponse', () => {
    it('should build correct response for single page', () => {
        const data = ['a', 'b', 'c'];
        const result = buildPaginatedResponse(data, 3, { page: 1, limit: 10, offset: 0 });

        expect(result.data).toEqual(['a', 'b', 'c']);
        expect(result.pagination).toEqual({
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
        });
    });

    it('should indicate hasNext when more pages exist', () => {
        const data = [1, 2, 3];
        const result = buildPaginatedResponse(data, 30, { page: 1, limit: 10, offset: 0 });

        expect(result.pagination.totalPages).toBe(3);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(false);
    });

    it('should indicate hasPrev on middle page', () => {
        const data = [1, 2, 3];
        const result = buildPaginatedResponse(data, 30, { page: 2, limit: 10, offset: 10 });

        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(true);
    });

    it('should indicate no hasNext on last page', () => {
        const data = [1, 2, 3];
        const result = buildPaginatedResponse(data, 23, { page: 3, limit: 10, offset: 20 });

        expect(result.pagination.totalPages).toBe(3);
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle empty data', () => {
        const result = buildPaginatedResponse([], 0, { page: 1, limit: 10, offset: 0 });

        expect(result.data).toEqual([]);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(false);
    });

    it('should preserve original data type', () => {
        const objects = [{ id: 1, name: 'test' }];
        const result = buildPaginatedResponse(objects, 1, { page: 1, limit: 10, offset: 0 });

        expect(result.data[0]).toEqual({ id: 1, name: 'test' });
    });
});
