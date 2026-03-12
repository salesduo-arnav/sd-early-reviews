import { fetchWithAuth } from './httpClient';
import type { PaginatedResponse } from './types';

export type { PaginationMeta, PaginatedResponse } from './types';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface Campaign {
    id: string;
    product_title: string;
    asin: string;
    product_image_url: string;
    product_description: string;
    product_rating?: number;
    product_rating_count?: number;
    target_reviews: number;
    claimed_count: number;
    region: string;
    category: string;
    status: CampaignStatus;
    guidelines: string;
    product_price: number;
    created_at: string;
    reimbursement_percent: number;
}

export interface AsinLookupResponse {
    product_title: string;
    product_photo: string;
    product_price: string;
    product_description?: string | null;
    product_star_rating?: string | null;
    product_num_ratings?: number | null;
    about_product?: string[];
    product_category?: string;
    category?: { id: string; name: string };
    [key: string]: unknown;
}

export const campaignsApi = {
    lookupAsin: async (asin: string, country: string): Promise<AsinLookupResponse> => {
        return fetchWithAuth(`/campaigns/lookup?asin=${asin}&country=${country}`);
    },

    getCampaigns: async (page = 1, limit = 12): Promise<PaginatedResponse<Campaign>> => {
        return fetchWithAuth(`/campaigns?page=${page}&limit=${limit}`);
    },

    getCampaignById: async (id: string): Promise<Campaign | undefined> => {
        return fetchWithAuth(`/campaigns/${id}`);
    },

    togglePauseStatus: async (id: string): Promise<Campaign> => {
        return fetchWithAuth(`/campaigns/${id}/status`, { method: 'PATCH' });
    },

    createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
        return fetchWithAuth('/campaigns', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
