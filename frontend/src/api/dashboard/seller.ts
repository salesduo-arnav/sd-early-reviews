import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../store/authStore';
import { PaginatedResponse } from '../campaigns';

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
}

const fetchWithAuth = async (endpoint: string) => {
    const token = useAuthStore.getState().tokens?.accessToken;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
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
    }
};
