import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface Campaign {
    id: string;
    product_title: string;
    asin: string;
    product_image_url: string;
    product_description: string;
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

const getHeaders = () => {
    const token = useAuthStore.getState().tokens?.accessToken;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export interface AsinLookupResponse {
    product_title: string;
    product_photo: string;
    product_price: string;
    product_description?: string | null;
    about_product?: string[];
    product_category?: string;
    category?: { id: string; name: string };
    [key: string]: unknown;
}

export const campaignsApi = {
    lookupAsin: async (asin: string, country: string): Promise<AsinLookupResponse> => {
        const response = await fetch(`${API_BASE_URL}/campaigns/lookup?asin=${asin}&country=${country}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getCampaigns: async (): Promise<Campaign[]> => {
        const response = await fetch(`${API_BASE_URL}/campaigns`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getCampaignById: async (id: string): Promise<Campaign | undefined> => {
        const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    togglePauseStatus: async (id: string): Promise<Campaign> => {
        const response = await fetch(`${API_BASE_URL}/campaigns/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
        const response = await fetch(`${API_BASE_URL}/campaigns`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    }
};
