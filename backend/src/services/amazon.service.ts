import { logger } from '../utils/logger';

const RAPID_API_KEY = process.env.RAPID_API_KEY || "";
const REALTIME_API_BASE = process.env.RAPID_API_BASE_URL || "https://real-time-amazon-data.p.rapidapi.com";

const COUNTRY_DOMAINS: Record<string, string> = {
    "US": "com", "UK": "co.uk", "GB": "co.uk", "DE": "de", "FR": "fr",
    "IT": "it", "ES": "es", "CA": "ca", "JP": "co.jp", "IN": "in",
    "MX": "com.mx", "AU": "com.au", "BR": "com.br", "NL": "nl",
    "SE": "se", "PL": "pl", "TR": "com.tr", "AE": "ae", "SA": "sa",
};

const COUNTRY_TO_API: Record<string, string> = {
    "US": "US", "UK": "GB", "GB": "GB", "DE": "DE", "FR": "FR",
    "IT": "IT", "ES": "ES", "CA": "CA", "JP": "JP", "IN": "IN",
    "MX": "MX", "AU": "AU", "BR": "BR", "NL": "NL", "SE": "SE",
    "PL": "PL", "TR": "TR", "AE": "AE", "SA": "SA",
};

function validateCountryCode(country: string): string {
    const countryUpper = country.toUpperCase();
    if (!COUNTRY_DOMAINS[countryUpper]) {
        for (const code in COUNTRY_DOMAINS) {
            if (code.startsWith(countryUpper) || countryUpper.startsWith(code)) {
                return code;
            }
        }
        return "US";
    }
    return countryUpper;
}

function getApiCountryCode(country: string): string {
    const normalizedCountry = validateCountryCode(country);
    return COUNTRY_TO_API[normalizedCountry] || "US";
}

export async function fetchAsinDetailsRealTime(asin: string, country: string = "US", maxRetries: number = 3): Promise<Record<string, unknown> | null> {
    const apiCountry = getApiCountryCode(country);
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
