import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

const fetchWithAuth = async (endpoint: string, options?: RequestInit) => {
    const token = useAuthStore.getState().tokens?.accessToken;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `API error: ${response.statusText}`);
    }

    return response.json();
};

// --- Types ---

export interface AdminMetrics {
    platformRevenue: number;
    pendingOrderVerifications: number;
    pendingReviewVerifications: number;
    activeCampaigns: number;
    totalBuyers: number;
    totalSellers: number;
    pendingPayouts: number;
}

export interface ChartDataPoint {
    date: string;
    [key: string]: string | number;
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

// --- API ---

export const adminApi = {
    // Dashboard
    getMetrics: (): Promise<AdminMetrics> =>
        fetchWithAuth('/admin/dashboard/metrics'),

    getRevenueChart: (startDate?: string, endDate?: string): Promise<ChartDataPoint[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/dashboard/revenue-chart?${params.toString()}`);
    },

    getClaimsChart: (startDate?: string, endDate?: string): Promise<ChartDataPoint[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/dashboard/claims-chart?${params.toString()}`);
    },

    getUsersChart: (startDate?: string, endDate?: string): Promise<ChartDataPoint[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/dashboard/users-chart?${params.toString()}`);
    },

    // Verifications
    getPendingOrders: (page = 1, limit = 10, search?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/verifications/orders?${params.toString()}`);
    },

    getPendingReviews: (page = 1, limit = 10, search?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/verifications/reviews?${params.toString()}`);
    },

    getClaimDetail: (id: string) =>
        fetchWithAuth(`/admin/verifications/${id}`),

    verifyOrder: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) =>
        fetchWithAuth(`/admin/verifications/${id}/order`, {
            method: 'PATCH',
            body: JSON.stringify({ action, reason }),
        }),

    verifyReview: (id: string, action: 'APPROVE' | 'REJECT', reason?: string) =>
        fetchWithAuth(`/admin/verifications/${id}/review`, {
            method: 'PATCH',
            body: JSON.stringify({ action, reason }),
        }),

    // Buyers
    getBuyers: (page = 1, limit = 10, search?: string, blacklisted?: string, region?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        if (blacklisted) params.append('blacklisted', blacklisted);
        if (region) params.append('region', region);
        return fetchWithAuth(`/admin/buyers?${params.toString()}`);
    },

    getBuyerDetail: (id: string, page = 1, limit = 5) =>
        fetchWithAuth(`/admin/buyers/${id}?page=${page}&limit=${limit}`),

    toggleBlacklist: (id: string, is_blacklisted: boolean, reason?: string) =>
        fetchWithAuth(`/admin/buyers/${id}/blacklist`, {
            method: 'PATCH',
            body: JSON.stringify({ is_blacklisted, reason }),
        }),

    // Sellers
    getSellers: (page = 1, limit = 10, search?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/sellers?${params.toString()}`);
    },

    getSellerDetail: (id: string, page = 1, limit = 5) =>
        fetchWithAuth(`/admin/sellers/${id}?page=${page}&limit=${limit}`),

    // Campaigns
    getCampaigns: (page = 1, limit = 10, search?: string, status?: string, region?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        if (status && status !== 'ALL') params.append('status', status);
        if (region) params.append('region', region);
        return fetchWithAuth(`/admin/campaigns?${params.toString()}`);
    },

    getCampaignDetail: (id: string, page = 1, limit = 10) =>
        fetchWithAuth(`/admin/campaigns/${id}?page=${page}&limit=${limit}`),

    toggleCampaignStatus: (id: string) =>
        fetchWithAuth(`/admin/campaigns/${id}/status`, { method: 'PATCH' }),

    // Payouts
    getPayouts: (page = 1, limit = 10, status?: string, search?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status && status !== 'ALL') params.append('status', status);
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/payouts?${params.toString()}`);
    },

    updatePayoutStatus: (id: string, status: 'PROCESSED' | 'FAILED', override_amount?: number) =>
        fetchWithAuth(`/admin/payouts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, override_amount }),
        }),

    batchUpdatePayouts: (claim_ids: string[], status: 'PROCESSED' | 'FAILED') =>
        fetchWithAuth('/admin/payouts/batch', {
            method: 'POST',
            body: JSON.stringify({ claim_ids, status }),
        }),

    // Transactions
    getTransactions: (page = 1, limit = 10, type?: string, status?: string, search?: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (type && type !== 'ALL') params.append('type', type);
        if (status && status !== 'ALL') params.append('status', status);
        if (search) params.append('search', search);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/transactions?${params.toString()}`);
    },

    // Config
    getConfigs: () =>
        fetchWithAuth('/admin/config'),

    updateConfig: (key: string, value: string) =>
        fetchWithAuth(`/admin/config/${encodeURIComponent(key)}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
        }),

    createConfig: (key: string, value: string, description?: string) =>
        fetchWithAuth('/admin/config', {
            method: 'POST',
            body: JSON.stringify({ key, value, description }),
        }),

    deleteConfig: (key: string) =>
        fetchWithAuth(`/admin/config/${encodeURIComponent(key)}`, { method: 'DELETE' }),

    // Audit Logs
    getAuditLogs: (page = 1, limit = 20, search?: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/audit-logs?${params.toString()}`);
    },

    // Notifications
    broadcastNotification: (target: string | string[], title: string, message: string, priority?: string, action_link?: string) =>
        fetchWithAuth('/admin/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify({ target, title, message, priority, action_link }),
        }),
};
