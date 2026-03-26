/**
 * Marketplace configuration and region utilities.
 *
 * ISO 3166-1 alpha-2 country codes are the primary key used throughout
 * the application (database, API, components).
 *
 * Backend counterpart: backend/src/config/marketplaces.ts
 * Keep both files in sync when adding or removing marketplaces.
 */

export interface MarketplaceConfig {
    /** ISO 3166-1 alpha-2 country code (US, GB, DE, JP, …) */
    code: string;
    /** Amazon domain suffix used in URLs (com, co.uk, de, co.jp, …) */
    domain: string;
    /** English display name */
    name: string;
    /** ISO 4217 currency code (USD, GBP, EUR, …) */
    currency: string;
    /** Display symbol ($, £, €, …) */
    currencySymbol: string;
    /** Number of decimal digits for this currency */
    decimalDigits: number;
}

export const MARKETPLACES: Record<string, MarketplaceConfig> = {
    US: { code: 'US', domain: 'com',    name: 'United States',  currency: 'USD', currencySymbol: '$',    decimalDigits: 2 },
    CA: { code: 'CA', domain: 'ca',     name: 'Canada',         currency: 'CAD', currencySymbol: 'CA$',  decimalDigits: 2 },
    MX: { code: 'MX', domain: 'com.mx', name: 'Mexico',         currency: 'MXN', currencySymbol: 'MX$',  decimalDigits: 2 },
    BR: { code: 'BR', domain: 'com.br', name: 'Brazil',         currency: 'BRL', currencySymbol: 'R$',   decimalDigits: 2 },
    GB: { code: 'GB', domain: 'co.uk',  name: 'United Kingdom', currency: 'GBP', currencySymbol: '£',    decimalDigits: 2 },
    DE: { code: 'DE', domain: 'de',     name: 'Germany',        currency: 'EUR', currencySymbol: '€',    decimalDigits: 2 },
    FR: { code: 'FR', domain: 'fr',     name: 'France',         currency: 'EUR', currencySymbol: '€',    decimalDigits: 2 },
    IT: { code: 'IT', domain: 'it',     name: 'Italy',          currency: 'EUR', currencySymbol: '€',    decimalDigits: 2 },
    ES: { code: 'ES', domain: 'es',     name: 'Spain',          currency: 'EUR', currencySymbol: '€',    decimalDigits: 2 },
    NL: { code: 'NL', domain: 'nl',     name: 'Netherlands',    currency: 'EUR', currencySymbol: '€',    decimalDigits: 2 },
    SE: { code: 'SE', domain: 'se',     name: 'Sweden',         currency: 'SEK', currencySymbol: 'kr ',  decimalDigits: 2 },
    PL: { code: 'PL', domain: 'pl',     name: 'Poland',         currency: 'PLN', currencySymbol: 'zł ',  decimalDigits: 2 },
    AE: { code: 'AE', domain: 'ae',     name: 'UAE',            currency: 'AED', currencySymbol: 'AED ', decimalDigits: 2 },
    SA: { code: 'SA', domain: 'sa',     name: 'Saudi Arabia',   currency: 'SAR', currencySymbol: 'SAR ', decimalDigits: 2 },
    EG: { code: 'EG', domain: 'eg',     name: 'Egypt',          currency: 'EGP', currencySymbol: 'EGP ', decimalDigits: 2 },
    IN: { code: 'IN', domain: 'in',     name: 'India',          currency: 'INR', currencySymbol: '₹',    decimalDigits: 2 },
    JP: { code: 'JP', domain: 'co.jp',  name: 'Japan',          currency: 'JPY', currencySymbol: '¥',    decimalDigits: 0 },
    AU: { code: 'AU', domain: 'com.au', name: 'Australia',      currency: 'AUD', currencySymbol: 'A$',   decimalDigits: 2 },
    SG: { code: 'SG', domain: 'sg',     name: 'Singapore',      currency: 'SGD', currencySymbol: 'S$',   decimalDigits: 2 },
    CN: { code: 'CN', domain: 'cn',     name: 'China',          currency: 'CNY', currencySymbol: '¥',    decimalDigits: 0 },
};

/** Flat list of all marketplaces, sorted alphabetically by name. */
export const MARKETPLACE_LIST: MarketplaceConfig[] = Object.values(MARKETPLACES)
    .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Reverse lookup: Amazon domain suffix → ISO country code.
 * Handles legacy data that may still use domain suffixes.
 */
export const DOMAIN_TO_ISO: Record<string, string> = {
    ...Object.fromEntries(Object.values(MARKETPLACES).map(m => [m.domain, m.code])),
    jp: 'JP', // Handle legacy jp/co.jp inconsistency
};

/** ISO 4217 currency code → first matching marketplace config (for formatting by currency). */
const CURRENCY_TO_MARKETPLACE: Record<string, MarketplaceConfig> = Object.fromEntries(
    // Reverse: ensure unique currency keys; first match wins (e.g., EUR → DE)
    Object.values(MARKETPLACES).reverse().map(m => [m.currency, m]),
);

/** ISO code → country display name (used by marketplace sidebar filters, etc.) */
export const REGION_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
    Object.values(MARKETPLACES).map(m => [m.code, m.name]),
);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get marketplace config by ISO country code, falling back to US. */
export function getMarketplace(code: string): MarketplaceConfig {
    const upper = code?.toUpperCase();
    if (MARKETPLACES[upper]) return MARKETPLACES[upper];
    // Fallback: try domain-based lookup for legacy data
    const iso = DOMAIN_TO_ISO[code];
    if (iso) return MARKETPLACES[iso];
    return MARKETPLACES.US;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Format a price with the correct currency symbol for a given ISO country code. */
export function formatPrice(amount: number, code: string): string {
    const m = getMarketplace(code);
    return `${m.currencySymbol}${Number(amount).toFixed(m.decimalDigits)}`;
}

/** Format a price given an ISO 4217 currency code (USD, EUR, INR, …) instead of a country code. */
export function formatPriceByCurrency(amount: number, currencyCode: string): string {
    const m = CURRENCY_TO_MARKETPLACE[currencyCode?.toUpperCase()];
    if (m) return `${m.currencySymbol}${Number(amount).toFixed(m.decimalDigits)}`;
    // Fallback: show code + amount
    return `${currencyCode} ${Number(amount).toFixed(2)}`;
}

/** Get the currency symbol for an ISO country code. */
export function getCurrencySymbol(code: string): string {
    return getMarketplace(code).currencySymbol;
}

// ---------------------------------------------------------------------------
// Amazon URL helpers
// ---------------------------------------------------------------------------

/** Build the full Amazon domain from an ISO country code (e.g. "GB" → "amazon.co.uk"). */
export function getAmazonDomain(code: string): string {
    return `amazon.${getMarketplace(code).domain}`;
}

/** Build the full Amazon product URL from an ISO country code and ASIN. */
export function getAmazonProductUrl(code: string, asin: string): string {
    return `https://www.${getAmazonDomain(code)}/dp/${asin}`;
}

// ---------------------------------------------------------------------------
// Dropdown helpers (for campaign wizard, onboarding, bank account, etc.)
// ---------------------------------------------------------------------------

/** Options for marketplace/region selects — shows "Country (Amazon.domain)". */
export function getMarketplaceOptions(): Array<{ value: string; label: string }> {
    return MARKETPLACE_LIST.map(m => ({
        value: m.code,
        label: `${m.name} (Amazon.${m.domain})`,
    }));
}

/** Options for bank account country selects — shows "Country (CURRENCY)". */
export function getCountryOptions(): Array<{ code: string; currency: string; label: string }> {
    return MARKETPLACE_LIST.map(m => ({
        code: m.code,
        currency: m.currency,
        label: `${m.name} (${m.currency})`,
    }));
}

// ---------------------------------------------------------------------------
// Browser-based region detection
// ---------------------------------------------------------------------------

/** Best-effort detection of user's region from browser locale/timezone. Returns an ISO country code. */
export function detectUserRegion(): string | undefined {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const lang = navigator.language?.toLowerCase() || '';

        // Timezone-based detection
        if (tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Denver') || tz.startsWith('America/Los_Angeles') || tz.startsWith('US/')) return 'US';
        if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('Canada/')) return 'CA';
        if (tz.startsWith('Europe/London')) return 'GB';
        if (tz.startsWith('Europe/Berlin')) return 'DE';
        if (tz.startsWith('Europe/Paris')) return 'FR';
        if (tz.startsWith('Europe/Rome')) return 'IT';
        if (tz.startsWith('Europe/Madrid')) return 'ES';
        if (tz.startsWith('Asia/Tokyo')) return 'JP';
        if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'IN';
        if (tz.startsWith('Australia/')) return 'AU';
        if (tz.startsWith('Asia/Dubai')) return 'AE';
        if (tz.startsWith('Asia/Riyadh')) return 'SA';

        // Fallback: language-based
        if (lang.startsWith('en-us')) return 'US';
        if (lang.startsWith('en-gb')) return 'GB';
        if (lang.startsWith('en-ca')) return 'CA';
        if (lang.startsWith('en-au')) return 'AU';
        if (lang.startsWith('en-in')) return 'IN';
        if (lang.startsWith('de')) return 'DE';
        if (lang.startsWith('fr-ca')) return 'CA';
        if (lang.startsWith('fr')) return 'FR';
        if (lang.startsWith('it')) return 'IT';
        if (lang.startsWith('es')) return 'ES';
        if (lang.startsWith('ja')) return 'JP';
        if (lang.startsWith('hi')) return 'IN';
    } catch {
        // Intl not available
    }
    return undefined;
}
