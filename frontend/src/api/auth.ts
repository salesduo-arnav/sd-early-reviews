import { API_BASE_URL } from '../config';

// Define the shape of our expected responses
export interface AuthResponse {
    message: string;
    tokens?: {
        accessToken: string;
        refreshToken: string;
    };
    user?: {
        id: string;
        email: string;
        role: string;
        is_verified: boolean;
    };
    otpToken?: string;
}

const handleResponse = async (response: Response): Promise<AuthResponse> => {
    const data = await response.json();

    if (!response.ok) {
        if (response.status >= 500) {
            throw new Error('An unexpected server error occurred. Please try again later.');
        }
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

export const authApi = {
    signup: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    verifyEmail: async (data: { otp: string; otpToken: string }): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    login: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    loginOtpRequest: async (data: { email: string }): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/login-otp-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    loginOtpVerify: async (data: { otp: string; otpToken: string }): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/login-otp-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    forgotPassword: async (data: { email: string }): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    resetPassword: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};
