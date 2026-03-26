import { logger } from '../utils/logger';

/**
 * Simple exchange-rate service with in-memory caching.
 *
 * Rates are fetched from the Open Exchange Rates API (free tier, 1 000 req/month).
 * Falls back to a static snapshot when the API is unavailable.
 *
 * All rates are relative to USD (base currency).
 *   rateMap['INR'] = 83.5  → 1 USD = 83.5 INR
 *   To convert 5 000 INR → USD:  5000 / 83.5 ≈ 59.88
 *   To convert 100 USD → INR:    100 * 83.5 = 8 350
 */

const OPEN_EXCHANGE_RATES_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID || '';
const CACHE_TTL_MS = parseInt(process.env.EXCHANGE_RATE_CACHE_HOURS || '24', 10) * 60 * 60 * 1000;

// Fallback rates (approximate, updated 2026-03)
const FALLBACK_RATES: Record<string, number> = {
    USD: 1,
    CAD: 1.36, MXN: 17.2, BRL: 5.05,
    GBP: 0.79, EUR: 0.92,
    SEK: 10.4, PLN: 3.95,
    AED: 3.67, SAR: 3.75, EGP: 50.5,
    INR: 83.5, JPY: 149.5,
    AUD: 1.55, SGD: 1.34, CNY: 7.25,
};

let cachedRates: Record<string, number> = { ...FALLBACK_RATES };
let cacheTimestamp = 0;

async function refreshRates(): Promise<void> {
    if (!OPEN_EXCHANGE_RATES_APP_ID) {
        logger.debug('No OPEN_EXCHANGE_RATES_APP_ID set, using fallback rates');
        return;
    }

    try {
        const url = `https://openexchangerates.org/api/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}&base=USD`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { rates?: Record<string, number> };
        if (data.rates) {
            cachedRates = { ...FALLBACK_RATES, ...data.rates };
            cacheTimestamp = Date.now();
            logger.info('Exchange rates refreshed', { currencies: Object.keys(data.rates).length });
        }
    } catch (err) {
        logger.warn('Failed to refresh exchange rates, using cached/fallback', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

async function ensureRates(): Promise<Record<string, number>> {
    if (Date.now() - cacheTimestamp > CACHE_TTL_MS) {
        await refreshRates();
    }
    return cachedRates;
}

/**
 * Convert an amount from one currency to another via USD as the pivot.
 * Returns the converted amount (not rounded — caller decides precision).
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    const rates = await ensureRates();
    const fromRate = rates[from.toUpperCase()] ?? 1;
    const toRate = rates[to.toUpperCase()] ?? 1;
    // amount in FROM → USD → TO
    return (amount / fromRate) * toRate;
}

/**
 * Convert an amount to USD.
 */
export async function toUSD(amount: number, fromCurrency: string): Promise<number> {
    return convertCurrency(amount, fromCurrency, 'USD');
}

/**
 * Convert an amount from USD to a target currency.
 */
export async function fromUSD(amountUSD: number, toCurrency: string): Promise<number> {
    return convertCurrency(amountUSD, 'USD', toCurrency);
}
