/**
 * Utility functions for automated review verification.
 */
import fuzzball from 'fuzzball';

/**
 * Extract review ID from a review URL or plain ID.
 * Handles formats like:
 *   https://www.amazon.com/gp/customer-reviews/RYRK6K6MMXB9C
 *   https://amazon.in/gp/customer-reviews/R25WD129M8HGW7?ref=pf_vv_at_pdctrvw_srp
 *   RYRK6K6MMXB9C (plain ID)
 */
export function extractReviewId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    // Try parsing as URL
    try {
        const parsed = new URL(trimmed);
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        // Look for 'customer-reviews' segment
        const reviewIdx = pathParts.indexOf('customer-reviews');
        if (reviewIdx !== -1 && reviewIdx + 1 < pathParts.length) {
            return pathParts[reviewIdx + 1];
        }
        // Also handle /review/ paths
        const reviewIdx2 = pathParts.indexOf('review');
        if (reviewIdx2 !== -1 && reviewIdx2 + 1 < pathParts.length) {
            return pathParts[reviewIdx2 + 1];
        }
    } catch {
        // Not a URL, treat as plain ID
    }

    // If it looks like a plain review ID (alphanumeric, typically 13-14 chars)
    if (/^[A-Z0-9]{10,20}$/i.test(trimmed)) {
        return trimmed;
    }

    return null;
}

/**
 * Compute text similarity (0-1) between two strings using fuzzball's token_set_ratio.
 * token_set_ratio is order-independent and handles partial matches well,
 * making it ideal for comparing review text that may be slightly edited.
 */
export function computeTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    return fuzzball.token_set_ratio(text1, text2) / 100;
}
