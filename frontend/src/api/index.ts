import { API_BASE_URL } from '../config';

export const pingBackend = async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
        throw new Error('Failed to ping backend');
    }
    return response.text();
};
