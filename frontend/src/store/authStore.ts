import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: string;
    email: string;
    role: string;
    is_verified: boolean;
    has_profile: boolean;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

interface AuthState {
    user: User | null;
    tokens: Tokens | null;
    isAuthenticated: boolean;
    login: (user: User, tokens: Tokens) => void;
    logout: () => void;
    completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            tokens: null,
            isAuthenticated: false,
            login: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
            logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
            completeOnboarding: () => set((state) => ({ user: state.user ? { ...state.user, has_profile: true } : null })),
        }),
        {
            name: 'auth-storage', // unique name for localStorage key
        }
    )
);
