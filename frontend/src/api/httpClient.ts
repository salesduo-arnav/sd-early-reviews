import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

async function handleResponse<T = unknown>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({ message: response.statusText }));
    if (!response.ok) {
        throw new Error(data.message || `API error: ${response.statusText}`);
    }
    return data as T;
}

export async function fetchWithAuth<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = useAuthStore.getState().tokens?.accessToken;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    return handleResponse<T>(response);
}

export async function fetchPublic<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    return handleResponse<T>(response);
}

export function buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    }
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
}
