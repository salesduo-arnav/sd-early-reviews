// ─── Types ──────────────────────────────────────────────────────────────────
// TODO: Move to a shared types file once schemas stabilize

export interface MarketplaceProduct {
    id: string;
    campaign_id: string;
    asin: string;
    title: string;
    image_url: string;
    price: number;
    reimbursement_pct: number;
    region: string;
    category: string;
}

export interface ClaimData {
    id: string;
    product_id: string;
    status: string;
    order_proof_url?: string;
    review_proof_url?: string;
    reimbursement_amount?: number;
    created_at: string;
    updated_at: string;
}

export interface BuyerProfile {
    id: string;
    email: string;
    amazon_profile_url: string;
    on_time_rate: number;
    total_earnings: number;
    claims_completed: number;
    approval_rate: number;
}

export interface BankDetails {
    id?: string;
    account_holder: string;
    routing_number: string;
    account_number: string;
}

// ─── API stubs ──────────────────────────────────────────────────────────────
// Each function is a placeholder. Implement the actual HTTP calls when the
// backend endpoints are ready.

export const buyerApi = {
    /** Fetch paginated marketplace products with optional filters */
    // TODO: implement GET /api/buyer/marketplace
    getMarketplaceProducts: async (_token: string, _params?: Record<string, unknown>) => {
        return { products: [] as MarketplaceProduct[], total: 0 };
    },

    /** Fetch single product details */
    // TODO: implement GET /api/buyer/marketplace/:id
    getProductDetails: async (_token: string, _productId: string) => {
        return {} as MarketplaceProduct;
    },

    /** Claim a product (submit order proof) */
    // TODO: implement POST /api/buyer/claims
    claimProduct: async (_token: string, _productId: string, _orderProof: File) => {
        return {} as ClaimData;
    },

    /** Upload order proof for an existing claim */
    // TODO: implement PATCH /api/buyer/claims/:id/order-proof
    uploadOrderProof: async (_token: string, _claimId: string, _file: File) => {
        return {} as ClaimData;
    },

    /** Upload review proof for an existing claim */
    // TODO: implement PATCH /api/buyer/claims/:id/review-proof
    uploadReviewProof: async (_token: string, _claimId: string, _file: File) => {
        return {} as ClaimData;
    },

    /** Get all claims for the current buyer */
    // TODO: implement GET /api/buyer/claims
    getMyClaims: async (_token: string, _params?: Record<string, unknown>) => {
        return { claims: [] as ClaimData[], total: 0 };
    },

    /** Get the buyer's account/profile details */
    // TODO: implement GET /api/buyer/profile
    getAccountProfile: async (_token: string) => {
        return {} as BuyerProfile;
    },

    /** Add or update bank details */
    // TODO: implement PUT /api/buyer/bank-details
    updateBankDetails: async (_token: string, _details: BankDetails) => {
        return {} as BankDetails;
    },

    /** Remove bank details */
    // TODO: implement DELETE /api/buyer/bank-details
    removeBankDetails: async (_token: string) => {
        return { success: true };
    },

    /** Get dashboard stats for the buyer */
    // TODO: implement GET /api/buyer/dashboard
    getDashboardStats: async (_token: string) => {
        return {
            activeClaims: 0,
            reviewsSubmitted: 0,
            totalEarnings: 0,
            approvalRate: 0,
        };
    },
};
