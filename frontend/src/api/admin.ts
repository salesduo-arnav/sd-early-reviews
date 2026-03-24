import { fetchWithAuth } from './httpClient';
import type { PaginatedResponse } from './types';

// Types

export type { PaginatedResponse };

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

export interface AdminPagination {
    page: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface AdminPaginatedResponse<T> {
    data: T[];
    pagination: AdminPagination;
}

export interface OrderRow {
    id: string;
    BuyerProfile?: { User?: { full_name: string; email: string } };
    Campaign?: { product_image_url: string; product_title: string; asin: string; region: string };
    amazon_order_id: string;
    purchase_date: string;
    expected_payout_amount: number;
    order_proof_url: string;
}

export interface ReviewRow {
    id: string;
    BuyerProfile?: { User?: { full_name: string; email: string } };
    Campaign?: { product_image_url: string; product_title: string; asin: string };
    review_rating: number;
    review_text: string;
    review_proof_url: string;
}

export interface BuyerRow {
    id: string;
    User?: { full_name: string; email: string; created_at: string };
    region: string;
    on_time_submission_rate: number;
    total_earnings: string;
    is_blacklisted: boolean;
}

export interface BuyerDetailResponse {
    buyer: {
        User?: { full_name: string; email: string; created_at: string; is_verified: boolean };
        region: string;
        is_blacklisted: boolean;
        blacklist_reason?: string;
        on_time_submission_rate: number;
        total_earnings: string;
    };
    claims: AdminPaginatedResponse<{
        id: string;
        Campaign?: { product_image_url: string; product_title: string; asin: string; region: string };
        expected_payout_amount: string;
        order_status: string;
        review_status: string;
        payout_status: string;
    }>;
}

export interface SellerRow {
    id: string;
    User?: { full_name: string; email: string; created_at: string };
    company_name?: string;
}

export interface SellerDetailResponse {
    seller: {
        User?: { full_name: string; email: string; created_at: string };
        company_name?: string;
    };
    campaigns: AdminPaginatedResponse<{
        id: string;
        product_title: string;
        product_image_url: string;
        asin: string;
        region: string;
        product_price: string;
        target_reviews: number;
        status: string;
    }>;
    totalSpent: number;
}

export interface CampaignRow {
    id: string;
    product_title: string;
    product_image_url: string;
    asin: string;
    SellerProfile?: { company_name: string; User?: { full_name: string; email: string } };
    region: string;
    status: string;
    completed_reviews?: number;
    target_reviews: number;
    product_price: string;
    reimbursement_percent: number;
    created_at: string;
}

export interface CampaignDetailResponse {
    campaign: {
        product_title: string;
        product_image_url: string;
        status: string;
        asin: string;
        created_at: string;
        SellerProfile?: { company_name: string; User?: { full_name: string; email: string } };
        region: string;
        product_price: string;
        reimbursement_percent: number;
        target_reviews: number;
        guidelines?: string;
    };
    claims: AdminPaginatedResponse<{
        id: string;
        BuyerProfile?: { User?: { full_name: string; email: string } };
        expected_payout_amount: string;
        order_status: string;
        review_status: string;
        payout_status: string;
    }>;
}

export interface PayoutRow {
    id: string;
    BuyerProfile?: { User?: { full_name: string; email: string }; wise_recipient_id?: string | null; bank_display_label?: string | null };
    Campaign?: { product_title: string; region: string };
    amazon_order_id: string;
    expected_payout_amount: number;
    payout_status: string;
    payout_method?: string | null;
    payout_processed_at?: string | null;
    review_approved_at?: string | null;
}

export interface TransactionRow {
    id: string;
    User?: { full_name: string; email: string };
    type: string;
    gross_amount: string;
    platform_fee: string;
    net_amount: string;
    stripe_transaction_id: string;
    status: string;
    created_at: string;
}

export interface ConfigEntry {
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
}

export interface AuditLogRow {
    id: string;
    User?: { full_name: string; email: string };
    action: string;
    target_type: string;
    target_id: string;
    created_at: string;
    ip_address?: string;
    details?: string;
}

// API

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
    getPendingOrders: (page = 1, limit = 10, search?: string): Promise<AdminPaginatedResponse<OrderRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/verifications/orders?${params.toString()}`);
    },

    getPendingReviews: (page = 1, limit = 10, search?: string): Promise<AdminPaginatedResponse<ReviewRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/verifications/reviews?${params.toString()}`);
    },

    getClaimDetail: (id: string): Promise<unknown> =>
        fetchWithAuth(`/admin/verifications/${id}`),

    verifyOrder: (id: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/verifications/${id}/order`, {
            method: 'PATCH',
            body: JSON.stringify({ action, reason }),
        }),

    verifyReview: (id: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/verifications/${id}/review`, {
            method: 'PATCH',
            body: JSON.stringify({ action, reason }),
        }),

    // Buyers
    getBuyers: (page = 1, limit = 10, search?: string, blacklisted?: string, region?: string): Promise<AdminPaginatedResponse<BuyerRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        if (blacklisted) params.append('blacklisted', blacklisted);
        if (region) params.append('region', region);
        return fetchWithAuth(`/admin/buyers?${params.toString()}`);
    },

    getBuyerDetail: (id: string, page = 1, limit = 5): Promise<BuyerDetailResponse> =>
        fetchWithAuth(`/admin/buyers/${id}?page=${page}&limit=${limit}`),

    toggleBlacklist: (id: string, is_blacklisted: boolean, reason?: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/buyers/${id}/blacklist`, {
            method: 'PATCH',
            body: JSON.stringify({ is_blacklisted, reason }),
        }),

    // Sellers
    getSellers: (page = 1, limit = 10, search?: string): Promise<AdminPaginatedResponse<SellerRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/sellers?${params.toString()}`);
    },

    getSellerDetail: (id: string, page = 1, limit = 5): Promise<SellerDetailResponse> =>
        fetchWithAuth(`/admin/sellers/${id}?page=${page}&limit=${limit}`),

    // Campaigns
    getCampaigns: (page = 1, limit = 10, search?: string, status?: string, region?: string): Promise<AdminPaginatedResponse<CampaignRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        if (status && status !== 'ALL') params.append('status', status);
        if (region) params.append('region', region);
        return fetchWithAuth(`/admin/campaigns?${params.toString()}`);
    },

    getCampaignDetail: (id: string, page = 1, limit = 10): Promise<CampaignDetailResponse> =>
        fetchWithAuth(`/admin/campaigns/${id}?page=${page}&limit=${limit}`),

    toggleCampaignStatus: (id: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/campaigns/${id}/status`, { method: 'PATCH' }),

    // Payouts
    getPayouts: (page = 1, limit = 10, status?: string, search?: string): Promise<AdminPaginatedResponse<PayoutRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status && status !== 'ALL') params.append('status', status);
        if (search) params.append('search', search);
        return fetchWithAuth(`/admin/payouts?${params.toString()}`);
    },

    updatePayoutStatus: (id: string, status: 'PROCESSED' | 'FAILED', override_amount?: number): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/payouts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, override_amount }),
        }),

    batchUpdatePayouts: (claim_ids: string[], status: 'PROCESSED' | 'FAILED'): Promise<{ message: string }> =>
        fetchWithAuth('/admin/payouts/batch', {
            method: 'POST',
            body: JSON.stringify({ claim_ids, status }),
        }),

    retryPayout: (id: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/payouts/${id}/retry`, { method: 'POST' }),

    // Transactions
    getTransactions: (page = 1, limit = 10, type?: string, status?: string, search?: string, startDate?: string, endDate?: string): Promise<AdminPaginatedResponse<TransactionRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (type && type !== 'ALL') params.append('type', type);
        if (status && status !== 'ALL') params.append('status', status);
        if (search) params.append('search', search);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/transactions?${params.toString()}`);
    },

    // Config
    getConfigs: (): Promise<ConfigEntry[]> =>
        fetchWithAuth('/admin/config'),

    updateConfig: (key: string, value: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/config/${encodeURIComponent(key)}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
        }),

    createConfig: (key: string, value: string, description?: string): Promise<{ message: string }> =>
        fetchWithAuth('/admin/config', {
            method: 'POST',
            body: JSON.stringify({ key, value, description }),
        }),

    deleteConfig: (key: string): Promise<{ message: string }> =>
        fetchWithAuth(`/admin/config/${encodeURIComponent(key)}`, { method: 'DELETE' }),

    // Audit Logs
    getAuditLogs: (page = 1, limit = 20, search?: string, startDate?: string, endDate?: string): Promise<AdminPaginatedResponse<AuditLogRow>> => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/admin/audit-logs?${params.toString()}`);
    },

    // Notifications
    broadcastNotification: (target: string | string[], title: string, message: string, priority?: string, action_link?: string): Promise<{ message: string }> =>
        fetchWithAuth('/admin/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify({ target, title, message, priority, action_link }),
        }),
};
