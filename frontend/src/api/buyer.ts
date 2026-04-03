import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';
import { fetchWithAuth, buildQueryString } from './httpClient';
import type { PaginatedResponse } from './types';

// Types

export interface MarketplaceProduct {
    id: string;
    campaign_id: string;
    asin: string;
    title: string;
    description?: string;
    image_url: string;
    price: number;
    rating?: number;
    rating_count?: number;
    reimbursement_pct: number;
    reimbursement_amount: string;
    region: string;
    category: string;
    target_reviews: number;
    claimed_count: number;
    slots_remaining: number;
    company_name: string;
    guidelines?: string;
    created_at: string;
}

export interface MarketplaceFilters {
    categories: string[];
    regions: string[];
}

export interface MarketplaceQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    region?: string;
    min_price?: number;
    max_price?: number;
    min_reimbursement?: number;
    max_reimbursement?: number;
    sort?: 'newest' | 'reimbursement' | 'popular' | 'price_low' | 'price_high';
}

export interface ClaimData {
    id: string;
    campaign_id: string;
    buyer_id: string;
    amazon_order_id: string;
    order_proof_url: string;
    purchase_date: string;
    order_status: string;
    review_status: string;
    payout_status: string;
    expected_payout_amount: number;
    review_deadline?: string;
    created_at: string;
}

export interface ClaimProductPayload {
    amazon_order_id: string;
    order_proof_url: string;
    purchase_date: string;
}

export interface BuyerClaim {
    id: string;
    campaign_id: string;
    amazon_order_id: string;
    purchase_date: string;
    order_status: string;
    review_status: string;
    payout_status: string;
    pipeline_status: string;
    expected_payout_amount: number;
    review_deadline: string | null;
    review_proof_url: string | null;
    review_rating: number | null;
    review_text: string | null;
    amazon_review_id: string | null;
    review_date: string | null;
    rejection_reason: string | null;
    order_proof_url: string | null;
    created_at: string;
    product_title: string;
    product_image_url: string;
    asin: string;
    region: string;
    guidelines: string | null;
    order_retry_count: number;
    review_retry_count: number;
}

export interface SubmitReviewPayload {
    review_proof_url: string;
    review_rating: number;
    review_title: string;
    review_text: string;
    amazon_review_id?: string;
}

export interface RetryOrderPayload {
    amazon_order_id: string;
    order_proof_url: string;
    purchase_date: string;
}

export interface ClaimsQueryParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sort?: 'newest' | 'oldest' | 'payout_high' | 'payout_low' | 'deadline';
}

export interface BuyerProfile {
    id: string;
    email: string;
    amazon_profile_url: string;
    region: string;
    on_time_rate: number;
    total_earnings: number;
    claims_completed: number;
    approval_rate: number | null;
    wise_connected: boolean;
    payout_currency: string | null;
    payout_country: string | null;
    bank_display_label: string | null;
    email_notifications_enabled: boolean;
    new_campaign_notifications_enabled: boolean;
    interested_categories: string[] | null;
    campaign_alerts_globally_enabled: boolean;
    is_blacklisted: boolean;
    blacklist_reason: string | null;
}

export interface WiseFieldGroup {
    key: string;
    type: string;
    refreshRequirementsOnChange: boolean;
    required: boolean;
    displayFormat: string | null;
    example: string;
    minLength: number | null;
    maxLength: number | null;
    validationRegexp: string | null;
    valuesAllowed: Array<{ key: string; name: string }> | null;
}

export interface WiseAccountRequirement {
    type: string;
    title: string;
    fields: Array<{
        name: string;
        group: WiseFieldGroup[];
    }>;
}

export interface ConnectBankPayload {
    currency: string;
    country: string;
    type: string;
    details: Record<string, string>;
}

export interface ConnectBankResponse {
    wise_connected: boolean;
    payout_currency: string | null;
    payout_country: string | null;
    bank_display_label: string | null;
}

// API

export const buyerApi = {
    getMarketplaceProducts: async (
        params: MarketplaceQueryParams = {},
    ): Promise<PaginatedResponse<MarketplaceProduct>> => {
        const qs = buildQueryString(params as Record<string, unknown>);
        return fetchWithAuth(`/marketplace${qs}`);
    },

    getProductDetails: async (productId: string): Promise<MarketplaceProduct> => {
        return fetchWithAuth(`/marketplace/${productId}`);
    },

    getFilters: async (): Promise<MarketplaceFilters> => {
        return fetchWithAuth('/marketplace/filters');
    },

    /** Upload an image file — uses FormData so we bypass the JSON httpClient */
    uploadImage: async (file: File): Promise<{ url: string }> => {
        const token = useAuthStore.getState().tokens?.accessToken;
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/uploads`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        return data;
    },

    claimProduct: async (
        campaignId: string,
        payload: ClaimProductPayload,
    ): Promise<{ message: string; claim: ClaimData }> => {
        return fetchWithAuth(`/marketplace/${campaignId}/claim`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    getMyClaims: async (params: ClaimsQueryParams = {}): Promise<PaginatedResponse<BuyerClaim>> => {
        const qs = buildQueryString(params as Record<string, unknown>);
        return fetchWithAuth(`/buyer/claims${qs}`);
    },

    getClaimDetail: async (claimId: string): Promise<BuyerClaim> => {
        return fetchWithAuth(`/buyer/claims/${claimId}`);
    },

    submitReviewProof: async (
        claimId: string,
        payload: SubmitReviewPayload,
    ): Promise<{ message: string; claim: BuyerClaim }> => {
        return fetchWithAuth(`/buyer/claims/${claimId}/review`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    cancelClaim: async (claimId: string): Promise<{ message: string }> => {
        return fetchWithAuth(`/buyer/claims/${claimId}`, { method: 'DELETE' });
    },

    retryOrder: async (
        claimId: string,
        payload: RetryOrderPayload,
    ): Promise<{ message: string; claim: BuyerClaim }> => {
        return fetchWithAuth(`/buyer/claims/${claimId}/retry-order`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    retryReview: async (
        claimId: string,
        payload: SubmitReviewPayload,
    ): Promise<{ message: string; claim: BuyerClaim }> => {
        return fetchWithAuth(`/buyer/claims/${claimId}/retry-review`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    getAccountProfile: async (): Promise<BuyerProfile> => {
        return fetchWithAuth('/buyer/profile');
    },

    getBankRequirements: async (currency: string): Promise<WiseAccountRequirement[]> => {
        return fetchWithAuth(`/buyer/bank-requirements?currency=${encodeURIComponent(currency)}`);
    },

    refreshBankRequirements: async (currency: string, formValues: Record<string, unknown>): Promise<WiseAccountRequirement[]> => {
        return fetchWithAuth(`/buyer/bank-requirements?currency=${encodeURIComponent(currency)}`, {
            method: 'POST',
            body: JSON.stringify(formValues),
        });
    },

    connectBankAccount: async (payload: ConnectBankPayload): Promise<ConnectBankResponse> => {
        return fetchWithAuth('/buyer/bank-account', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    disconnectBankAccount: async (): Promise<{ success: boolean }> => {
        return fetchWithAuth('/buyer/bank-account', { method: 'DELETE' });
    },

    updateNotificationPreferences: async (prefs: {
        email_notifications_enabled?: boolean;
        new_campaign_notifications_enabled?: boolean;
        interested_categories?: string[] | null;
    }): Promise<{
        email_notifications_enabled: boolean;
        new_campaign_notifications_enabled: boolean;
        interested_categories: string[] | null;
    }> => {
        return fetchWithAuth('/buyer/notifications', {
            method: 'PATCH',
            body: JSON.stringify(prefs),
        });
    },
};
