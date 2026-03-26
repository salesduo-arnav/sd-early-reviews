import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

/** Track in-flight refresh to avoid concurrent refresh calls */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
    const { tokens, login, logout } = useAuthStore.getState();
    if (!tokens?.refreshToken) {
        logout();
        return false;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!res.ok) {
            logout();
            return false;
        }

        const data = await res.json();
        const user = useAuthStore.getState().user;
        if (user && data.tokens) {
            login(user, data.tokens);
            return true;
        }
        logout();
        return false;
    } catch {
        logout();
        return false;
    }
}

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

    // If 401/403, attempt a token refresh and retry once
    if (response.status === 401 || response.status === 403) {
        // Deduplicate concurrent refresh attempts
        if (!refreshPromise) {
            refreshPromise = tryRefreshToken().finally(() => { refreshPromise = null; });
        }
        const refreshed = await refreshPromise;

        if (refreshed) {
            const newToken = useAuthStore.getState().tokens?.accessToken;
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });
            return handleResponse<T>(retryResponse);
        }

        // Refresh failed — logout already called, throw to let UI react
        throw new Error('Session expired. Please log in again.');
    }

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
