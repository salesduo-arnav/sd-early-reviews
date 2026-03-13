import { logger } from '../../utils/logger';

const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

const CLIENT_ID = process.env.AMZN_SP_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AMZN_SP_CLIENT_SECRET || '';

interface LwaTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

// In-memory access token cache: sellerProfileId -> { token, expiresAt }
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Exchange an SP-API OAuth authorization code for tokens via LWA.
 */
export async function exchangeCodeForTokens(authCode: string): Promise<{ refresh_token: string; access_token: string; expires_in: number }> {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    });

    const response = await fetch(LWA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logger.error('LWA token exchange failed', { status: response.status, body: errorBody });
        throw new Error(`LWA token exchange failed: ${response.status}`);
    }

    const data = await response.json() as LwaTokenResponse;
    return {
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_in: data.expires_in,
    };
}

/**
 * Get an access token from a refresh token. Caches tokens in memory.
 * @param refreshToken - Plaintext refresh token
 * @param sellerProfileId - Used as cache key
 */
export async function getAccessToken(refreshToken: string, sellerProfileId: string): Promise<string> {
    // Check cache first
    const cached = tokenCache.get(sellerProfileId);
    if (cached && cached.expiresAt > Date.now() + 60_000) { // 1-min buffer
        return cached.token;
    }

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
    });

    const response = await fetch(LWA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logger.error('LWA access token refresh failed', { status: response.status, body: errorBody });
        throw new Error(`LWA access token refresh failed: ${response.status}`);
    }

    const data = await response.json() as LwaTokenResponse;

    // Cache the access token
    tokenCache.set(sellerProfileId, {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
}

/**
 * Clear cached access token for a seller (e.g., on revoke).
 */
export function clearTokenCache(sellerProfileId: string): void {
    tokenCache.delete(sellerProfileId);
}
