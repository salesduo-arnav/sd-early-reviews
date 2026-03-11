import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';
import type { PaginatedResponse } from './campaigns';

// ─── Types ──────────────────────────────────────────────────────────────────

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
}

export interface SubmitReviewPayload {
    review_proof_url: string;
    review_rating: number;
    review_text: string;
    amazon_review_id?: string;
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
    on_time_rate: number;
    total_earnings: number;
    claims_completed: number;
    approval_rate: number | null;
    bank_details: {
        account_holder: string | null;
        routing_number: string | null;
        account_last4: string | null;
    };
    email_notifications_enabled: boolean;
    is_blacklisted: boolean;
    blacklist_reason: string | null;
}

export interface BankDetailsPayload {
    account_holder: string;
    routing_number: string;
    account_number: string;
}

export interface BankDetailsResponse {
    account_holder: string;
    routing_number: string;
    account_last4: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getHeaders = () => {
    const token = useAuthStore.getState().tokens?.accessToken;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data as T;
};

const buildQueryString = (params: Record<string, unknown>): string => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    }
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
};

// ─── API ────────────────────────────────────────────────────────────────────

export const buyerApi = {
    /** Fetch paginated marketplace products with optional filters & sorting */
    getMarketplaceProducts: async (
        params: MarketplaceQueryParams = {},
    ): Promise<PaginatedResponse<MarketplaceProduct>> => {
        const qs = buildQueryString(params as Record<string, unknown>);
        const response = await fetch(`${API_BASE_URL}/marketplace${qs}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    /** Fetch single product details */
    getProductDetails: async (productId: string): Promise<MarketplaceProduct> => {
        const response = await fetch(`${API_BASE_URL}/marketplace/${productId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    /** Fetch available filter options (categories, regions) */
    getFilters: async (): Promise<MarketplaceFilters> => {
        const response = await fetch(`${API_BASE_URL}/marketplace/filters`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    /** Upload an image file and return its URL */
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
        return handleResponse(response);
    },

    /** Claim a product by submitting order proof */
    claimProduct: async (
        campaignId: string,
        payload: ClaimProductPayload,
    ): Promise<{ message: string; claim: ClaimData }> => {
        const response = await fetch(`${API_BASE_URL}/marketplace/${campaignId}/claim`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    /** Get all claims for the current buyer with pagination and filtering */
    getMyClaims: async (params: ClaimsQueryParams = {}): Promise<PaginatedResponse<BuyerClaim>> => {
        const qs = buildQueryString(params as Record<string, unknown>);
        const response = await fetch(`${API_BASE_URL}/buyer/claims${qs}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    /** Get full details for a single claim */
    getClaimDetail: async (claimId: string): Promise<BuyerClaim> => {
        const response = await fetch(`${API_BASE_URL}/buyer/claims/${claimId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    /** Submit review proof for a claim */
    submitReviewProof: async (
        claimId: string,
        payload: SubmitReviewPayload,
    ): Promise<{ message: string; claim: BuyerClaim }> => {
        const response = await fetch(`${API_BASE_URL}/buyer/claims/${claimId}/review`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },

    /** Cancel a claim (only if order is still pending verification) */
    cancelClaim: async (claimId: string): Promise<{ message: string }> => {
        const response = await fetch(`${API_BASE_URL}/buyer/claims/${claimId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    /** Get the buyer's account/profile details */
    getAccountProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/buyer/profile`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse<BuyerProfile>(response);
    },

    /** Add or update bank details */
    updateBankDetails: async (details: BankDetailsPayload) => {
        const response = await fetch(`${API_BASE_URL}/buyer/bank-details`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(details),
        });
        return handleResponse<BankDetailsResponse>(response);
    },

    /** Remove bank details */
    removeBankDetails: async () => {
        const response = await fetch(`${API_BASE_URL}/buyer/bank-details`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse<{ success: boolean }>(response);
    },

    /** Update email notification preference */
    updateNotificationPreferences: async (enabled: boolean) => {
        const response = await fetch(`${API_BASE_URL}/buyer/notifications`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ email_notifications_enabled: enabled }),
        });
        return handleResponse<{ email_notifications_enabled: boolean }>(response);
    },
};
