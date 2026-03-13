import { fetchWithAuth } from './httpClient';
import type { PaginatedResponse } from './types';

export interface DashboardMetrics {
    activeCampaigns: number;
    totalReviews: number;
    reviewChangePercent: number;
    totalSpent: number;
}

export interface ReviewVelocity {
    date: string;
    completed: number;
}

export interface CampaignProgress {
    id: string;
    title: string;
    image: string;
    price: number;
    status: string;
    target: number;
    completed: number;
    product_rating?: number;
    product_rating_count?: number;
}

export interface SellerReview {
    id: string;
    campaign_id: string;
    asin: string;
    product_title: string;
    product_image_url: string;
    review_date: string | null;
    review_rating: number | null;
    review_text: string | null;
    review_status: string;
    amazon_order_id: string;
    expected_payout_amount: number;
    rejection_reason?: string | null;
    region?: string;
}

export interface SellerReviewStats {
    totalReviews: number;
    approvedReviews: number;
    pendingReviews: number;
    averageRating: number;
}

export interface SpapiStatus {
    authorized: boolean;
    authorizedAt: string | null;
    sellingPartnerId: string | null;
}

export const spapiApi = {
    getAuthUrl: async (): Promise<{ authUrl: string }> => {
        return fetchWithAuth('/spapi/auth-url');
    },

    getStatus: async (): Promise<SpapiStatus> => {
        return fetchWithAuth('/spapi/status');
    },

    revoke: async (): Promise<{ message: string }> => {
        return fetchWithAuth('/spapi/revoke', { method: 'POST' });
    },
};

export const dashboardApi = {
    getSellerMetrics: async (): Promise<DashboardMetrics> => {
        return fetchWithAuth('/dashboard/seller/metrics');
    },

    getSellerVelocity: async (startDate?: string, endDate?: string): Promise<ReviewVelocity[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/dashboard/seller/velocity?${params.toString()}`);
    },

    getSellerCampaignProgress: async (page = 1, limit = 6): Promise<PaginatedResponse<CampaignProgress>> => {
        return fetchWithAuth(`/dashboard/seller/campaign-progress?page=${page}&limit=${limit}`);
    },

    getSellerReviewStats: async (): Promise<SellerReviewStats> => {
        return fetchWithAuth('/dashboard/seller/reviews/stats');
    },

    getSellerReviews: async (page = 1, limit = 10, search?: string, status?: string, rating?: string, startDate?: string, endDate?: string): Promise<PaginatedResponse<SellerReview>> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status && status !== 'ALL') params.append('status', status);
        if (rating && rating !== 'ALL') params.append('rating', rating);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return fetchWithAuth(`/dashboard/seller/reviews?${params.toString()}`);
    }
};
