import { fetchPublic, fetchWithAuth } from './httpClient';

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
        has_profile: boolean;
    };
    otpToken?: string;
}

export const authApi = {
    signup: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        return fetchPublic('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    verifyEmail: async (data: { otp: string; otpToken: string }): Promise<AuthResponse> => {
        return fetchPublic('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    login: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        return fetchPublic('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    loginOtpRequest: async (data: { email: string }): Promise<AuthResponse> => {
        return fetchPublic('/auth/login-otp-request', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    loginOtpVerify: async (data: { otp: string; otpToken: string }): Promise<AuthResponse> => {
        return fetchPublic('/auth/login-otp-verify', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    forgotPassword: async (data: { email: string }): Promise<AuthResponse> => {
        return fetchPublic('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    resetPassword: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        return fetchPublic('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    googleAuth: async (data: { credential?: string; access_token?: string; role?: string }): Promise<AuthResponse> => {
        return fetchPublic('/auth/google', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    onboarding: async (data: Record<string, unknown>): Promise<AuthResponse> => {
        return fetchWithAuth('/auth/onboarding', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    me: async (): Promise<AuthResponse> => {
        return fetchWithAuth('/auth/me');
    }
};
