import { API_BASE_URL } from '../config';

export interface PlatformConfig {
    platform_fee_percent: number;
    [key: string]: number | string;
}

export const configApi = {
    getPublicConfig: async (): Promise<PlatformConfig> => {
        const response = await fetch(`${API_BASE_URL}/config`);
        if (!response.ok) throw new Error('Failed to fetch platform config');
        return response.json();
    },
};
