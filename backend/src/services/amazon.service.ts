import { logger } from '../utils/logger';
import { getMarketplace, MARKETPLACES } from '../config/marketplaces';

const RAPID_API_KEY = process.env.RAPID_API_KEY || "";
const REALTIME_API_BASE = process.env.RAPID_API_BASE_URL || "https://real-time-amazon-data.p.rapidapi.com";

export async function fetchAsinDetailsRealTime(asin: string, country: string = "US", maxRetries: number = 3): Promise<Record<string, unknown> | null> {
    // Normalize: ensure we have a valid ISO code; fall back to US
    const m = getMarketplace(country);
    const apiCountry = MARKETPLACES[m.code] ? m.code : 'US';
    const url = new URL(`${REALTIME_API_BASE}/product-details`);
    url.searchParams.append('country', apiCountry);
    url.searchParams.append('asin', asin);

    const headers = {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    };

    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url.toString(), { headers });
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
            }
            return await response.json();
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            lastError = error;
            logger.warn(`fetchAsinDetailsRealTime attempt ${attempt}/${maxRetries} failed for ASIN ${asin}: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    logger.error(`fetchAsinDetailsRealTime failed after ${maxRetries} retries for ASIN ${asin}: ${lastError?.message || 'Unknown error'}`);
    return null;
}

export interface ProfileReview {
    title: string;
    description: string;
    asinTitle: string;
    rating: number;
    viewOnAmazon: string;
    productImageUrl?: string;
}

export interface ProfileReviewsResult {
    reviews: ProfileReview[];
    nextPageToken: string;
}

/**
 * Fetch reviews from a buyer's Amazon profile page by scraping the profile HTML.
 * Extracts the `reviewsTimeline` data from the embedded `page-state-profile` script tag.
 */
export async function fetchProfileReviews(profileUrl: string, maxRetries: number = 3): Promise<ProfileReviewsResult | null> {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
    };

    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(profileUrl, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
            }

            const html = await response.text();

            // Amazon stores page data in a script tag with a-state "page-state-profile"
            const regex = /<script type="a-state" data-a-state="\{&quot;key&quot;:&quot;page-state-profile&quot;\}">([\s\S]*?)<\/script>/;
            const match = html.match(regex);

            if (!match || !match[1]) {
                throw new Error('Could not find profile review data block');
            }

            const fullState = JSON.parse(match[1].trim());
            const timeline = fullState.reviewsTimeline;

            if (!timeline || timeline.status !== 'SUCCESS') {
                return { reviews: [], nextPageToken: '' };
            }

            const reviews: ProfileReview[] = (timeline.shopItemModels || [])
                .filter((item: Record<string, unknown>) => item.itemContentType === 'Review')
                .map((item: Record<string, unknown>) => {
                    const rm = item.reviewModel as Record<string, unknown>;
                    return {
                        title: rm.title as string || '',
                        description: rm.description as string || '',
                        asinTitle: rm.asinTitle as string || '',
                        rating: rm.rating as number || 0,
                        viewOnAmazon: rm.viewOnAmazon as string || '',
                        productImageUrl: rm.productImageUrl as string || undefined,
                    };
                });

            return { reviews, nextPageToken: timeline.nextPageToken || '' };
        } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            lastError = error;
            logger.warn(`fetchProfileReviews attempt ${attempt}/${maxRetries} failed for ${profileUrl}: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    logger.error(`fetchProfileReviews failed after ${maxRetries} retries for ${profileUrl}: ${lastError?.message || 'Unknown error'}`);
    return null;
}
