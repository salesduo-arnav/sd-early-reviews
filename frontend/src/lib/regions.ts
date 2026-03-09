/**
 * Region utilities for the marketplace.
 *
 * Regions are stored as Amazon domain suffixes (e.g. "com", "co.uk", "de").
 * This matches the seller campaign creation wizard in Step1Product.tsx.
 */

/** Maps domain suffix → currency symbol and ISO code */
export const REGION_CURRENCY: Record<string, { symbol: string; code: string }> = {
    com: { symbol: '$', code: 'USD' },
    ca: { symbol: 'CA$', code: 'CAD' },
    'co.uk': { symbol: '£', code: 'GBP' },
    de: { symbol: '€', code: 'EUR' },
    fr: { symbol: '€', code: 'EUR' },
    it: { symbol: '€', code: 'EUR' },
    es: { symbol: '€', code: 'EUR' },
    'co.jp': { symbol: '¥', code: 'JPY' },
    in: { symbol: '₹', code: 'INR' },
    cn: { symbol: '¥', code: 'CNY' },
    ae: { symbol: 'AED ', code: 'AED' },
    sa: { symbol: 'SAR ', code: 'SAR' },
    eg: { symbol: 'EGP ', code: 'EGP' },
    'com.au': { symbol: 'A$', code: 'AUD' },
    'com.br': { symbol: 'R$', code: 'BRL' },
    'com.mx': { symbol: 'MX$', code: 'MXN' },
    nl: { symbol: '€', code: 'EUR' },
    sg: { symbol: 'S$', code: 'SGD' },
    se: { symbol: 'kr ', code: 'SEK' },
    pl: { symbol: 'zł ', code: 'PLN' },
};

/** Format a price with the correct currency symbol for a given region */
export function formatPrice(amount: number, region: string): string {
    const currency = REGION_CURRENCY[region] || REGION_CURRENCY['com'];
    const decimals = ['JPY', 'CNY'].includes(currency.code) ? 0 : 2;
    return `${currency.symbol}${Number(amount).toFixed(decimals)}`;
}

/** Get the currency symbol for a region */
export function getCurrencySymbol(region: string): string {
    return (REGION_CURRENCY[region] || REGION_CURRENCY['com']).symbol;
}

/** Maps domain suffix → human-readable country name */
export const REGION_DISPLAY_NAMES: Record<string, string> = {
    com: 'United States',
    ca: 'Canada',
    'co.uk': 'United Kingdom',
    de: 'Germany',
    fr: 'France',
    it: 'Italy',
    es: 'Spain',
    'co.jp': 'Japan',
    in: 'India',
    cn: 'China',
    ae: 'UAE',
    sa: 'Saudi Arabia',
    eg: 'Egypt',
    'com.au': 'Australia',
    'com.br': 'Brazil',
    'com.mx': 'Mexico',
    nl: 'Netherlands',
    sg: 'Singapore',
    se: 'Sweden',
    pl: 'Poland',
};

/** Builds the full Amazon domain from a region suffix */
export function getAmazonDomain(region: string): string {
    return `amazon.${region}`;
}

/** Builds the full Amazon product URL from a region suffix and ASIN */
export function getAmazonProductUrl(region: string, asin: string): string {
    return `https://www.${getAmazonDomain(region)}/dp/${asin}`;
}

/** Best-effort detection of user's region from browser locale/timezone.
 *  Returns a domain suffix matching the DB format. */
export function detectUserRegion(): string | undefined {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const lang = navigator.language?.toLowerCase() || '';

        // Timezone-based detection
        if (tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Denver') || tz.startsWith('America/Los_Angeles') || tz.startsWith('US/')) return 'com';
        if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('Canada/')) return 'ca';
        if (tz.startsWith('Europe/London')) return 'co.uk';
        if (tz.startsWith('Europe/Berlin')) return 'de';
        if (tz.startsWith('Europe/Paris')) return 'fr';
        if (tz.startsWith('Europe/Rome')) return 'it';
        if (tz.startsWith('Europe/Madrid')) return 'es';
        if (tz.startsWith('Asia/Tokyo')) return 'co.jp';
        if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'in';
        if (tz.startsWith('Australia/')) return 'com.au';
        if (tz.startsWith('Asia/Dubai')) return 'ae';
        if (tz.startsWith('Asia/Riyadh')) return 'sa';

        // Fallback: language-based
        if (lang.startsWith('en-us')) return 'com';
        if (lang.startsWith('en-gb')) return 'co.uk';
        if (lang.startsWith('en-ca')) return 'ca';
        if (lang.startsWith('en-au')) return 'com.au';
        if (lang.startsWith('en-in')) return 'in';
        if (lang.startsWith('de')) return 'de';
        if (lang.startsWith('fr-ca')) return 'ca';
        if (lang.startsWith('fr')) return 'fr';
        if (lang.startsWith('it')) return 'it';
        if (lang.startsWith('es')) return 'es';
        if (lang.startsWith('ja')) return 'co.jp';
        if (lang.startsWith('hi')) return 'in';
    } catch {
        // Intl not available
    }
    return undefined;
}
