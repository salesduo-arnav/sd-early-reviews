/**
 * Canonical marketplace configuration.
 *
 * ISO 3166-1 alpha-2 country codes are the primary key used throughout
 * the application (database, API, frontend).
 *
 * Frontend counterpart: frontend/src/lib/regions.ts
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
    /** SP-API regional grouping: NA | EU | FE */
    spApiRegion: string;
    /** Amazon Marketplace ID for SP-API calls */
    marketplaceId: string;
}

export const MARKETPLACES: Record<string, MarketplaceConfig> = {
    US: { code: 'US', domain: 'com',    name: 'United States',  currency: 'USD', currencySymbol: '$',    decimalDigits: 2, spApiRegion: 'NA', marketplaceId: 'ATVPDKIKX0DER' },
    CA: { code: 'CA', domain: 'ca',     name: 'Canada',         currency: 'CAD', currencySymbol: 'CA$',  decimalDigits: 2, spApiRegion: 'NA', marketplaceId: 'A2EUQ1WTGCTBG2' },
    MX: { code: 'MX', domain: 'com.mx', name: 'Mexico',         currency: 'MXN', currencySymbol: 'MX$',  decimalDigits: 2, spApiRegion: 'NA', marketplaceId: 'A1AM78C64UM0Y8' },
    BR: { code: 'BR', domain: 'com.br', name: 'Brazil',         currency: 'BRL', currencySymbol: 'R$',   decimalDigits: 2, spApiRegion: 'NA', marketplaceId: 'A2Q3Y263D00KWC' },
    GB: { code: 'GB', domain: 'co.uk',  name: 'United Kingdom', currency: 'GBP', currencySymbol: '£',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A1F83G8C2ARO7P' },
    DE: { code: 'DE', domain: 'de',     name: 'Germany',        currency: 'EUR', currencySymbol: '€',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A1PA6795UKMFR9' },
    FR: { code: 'FR', domain: 'fr',     name: 'France',         currency: 'EUR', currencySymbol: '€',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A13V1IB3VIYZZH' },
    IT: { code: 'IT', domain: 'it',     name: 'Italy',          currency: 'EUR', currencySymbol: '€',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'APJ6JRA9NG5V4' },
    ES: { code: 'ES', domain: 'es',     name: 'Spain',          currency: 'EUR', currencySymbol: '€',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A1RKKUPIHCS9HS' },
    NL: { code: 'NL', domain: 'nl',     name: 'Netherlands',    currency: 'EUR', currencySymbol: '€',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A1805IZSGTT6HS' },
    SE: { code: 'SE', domain: 'se',     name: 'Sweden',         currency: 'SEK', currencySymbol: 'kr ',  decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A2NODRKZP88ZB9' },
    PL: { code: 'PL', domain: 'pl',     name: 'Poland',         currency: 'PLN', currencySymbol: 'zł ',  decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A1C3SOZRARQ6R3' },
    AE: { code: 'AE', domain: 'ae',     name: 'UAE',            currency: 'AED', currencySymbol: 'AED ', decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A2VIGQ35RCS4UG' },
    SA: { code: 'SA', domain: 'sa',     name: 'Saudi Arabia',   currency: 'SAR', currencySymbol: 'SAR ', decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A17E79C6D8DWNP' },
    EG: { code: 'EG', domain: 'eg',     name: 'Egypt',          currency: 'EGP', currencySymbol: 'EGP ', decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'ARBP9OOSHTCHU' },
    IN: { code: 'IN', domain: 'in',     name: 'India',          currency: 'INR', currencySymbol: '₹',    decimalDigits: 2, spApiRegion: 'EU', marketplaceId: 'A21TJRUUN4KGV' },
    JP: { code: 'JP', domain: 'co.jp',  name: 'Japan',          currency: 'JPY', currencySymbol: '¥',    decimalDigits: 0, spApiRegion: 'FE', marketplaceId: 'A1VC38T7YXB528' },
    AU: { code: 'AU', domain: 'com.au', name: 'Australia',      currency: 'AUD', currencySymbol: 'A$',   decimalDigits: 2, spApiRegion: 'FE', marketplaceId: 'A39IBJ37TRP1C6' },
    SG: { code: 'SG', domain: 'sg',     name: 'Singapore',      currency: 'SGD', currencySymbol: 'S$',   decimalDigits: 2, spApiRegion: 'FE', marketplaceId: 'A19VAU5U5O7RUS' },
    CN: { code: 'CN', domain: 'cn',     name: 'China',          currency: 'CNY', currencySymbol: '¥',    decimalDigits: 0, spApiRegion: 'FE', marketplaceId: 'AAHKV2X7AFYLW' },
};

/**
 * Reverse lookup: Amazon domain suffix → ISO country code.
 * Handles legacy data that may have been stored as domain suffixes.
 */
export const DOMAIN_TO_ISO: Record<string, string> = {
    ...Object.fromEntries(Object.values(MARKETPLACES).map(m => [m.domain, m.code])),
    // Handle the legacy jp/co.jp inconsistency
    jp: 'JP',
};

/** Get a marketplace config by ISO country code, falling back to US. */
export function getMarketplace(code: string): MarketplaceConfig {
    return MARKETPLACES[code?.toUpperCase()] || MARKETPLACES.US;
}

/** Convert an ISO country code (or legacy domain suffix) to its ISO 4217 currency code. */
export function regionToCurrency(code: string): string {
    const upper = code?.toUpperCase();
    if (MARKETPLACES[upper]) return MARKETPLACES[upper].currency;
    // Fallback: try domain-based lookup for legacy data
    const iso = DOMAIN_TO_ISO[code];
    if (iso) return MARKETPLACES[iso].currency;
    return 'USD';
}

/**
 * Format an amount with its currency symbol for display in notifications/logs.
 * Accepts an ISO 4217 currency code (USD, INR, JPY, …).
 */
export function formatAmountWithCurrency(amount: number, currencyCode: string): string {
    const upper = currencyCode?.toUpperCase();
    // Find by currency code
    const m = Object.values(MARKETPLACES).find(mp => mp.currency === upper);
    if (m) return `${m.currencySymbol}${Number(amount).toFixed(m.decimalDigits)}`;
    return `${currencyCode} ${Number(amount).toFixed(2)}`;
}

/** Get the Amazon domain suffix for an ISO country code. */
export function getDomain(code: string): string {
    return getMarketplace(code).domain;
}

/** Get SP-API config for an ISO country code. */
export function getSpApiConfig(code: string): { spApiRegion: string; marketplaceId: string } | null {
    const upper = code?.toUpperCase();
    const m = MARKETPLACES[upper] || (DOMAIN_TO_ISO[code] ? MARKETPLACES[DOMAIN_TO_ISO[code]] : null);
    if (!m) return null;
    return { spApiRegion: m.spApiRegion, marketplaceId: m.marketplaceId };
}
