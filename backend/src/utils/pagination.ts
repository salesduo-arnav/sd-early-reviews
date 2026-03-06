/**
 * Shared backend pagination utility.
 * Parses `page` and `limit` from query params and returns
 * Sequelize-compatible `offset` and `limit`, plus metadata helpers.
 */

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export function parsePaginationParams(query: Record<string, unknown>, defaultLimit = 10): PaginationParams {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || defaultLimit));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

export function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / params.limit);
    return {
        data,
        pagination: {
            total,
            page: params.page,
            limit: params.limit,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
}
