/**
 * Currency conversion and formatting utilities for IPAM Web.
 * 
 * Standard currency is Sierra Leone Leone (SLE / NLe).
 * Exchange rate: 1 USD ≈ 22.50 SLE (NLe).
 * Can be overridden via environment variable FLOT_USD_SLE_RATE.
 */

export const DEFAULT_USD_SLE_RATE = 22.5;

export function getUsdToSleRate(): number {
  const envVal = process.env.FLOT_USD_SLE_RATE || process.env.NEXT_PUBLIC_FLOT_USD_SLE_RATE;
  if (envVal) {
    const parsed = parseFloat(envVal);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_USD_SLE_RATE;
}

/**
 * Convert SLE (Leones) to USD.
 */
export function sleToUsd(amountInSle: number): number {
  const rate = getUsdToSleRate();
  if (amountInSle <= 0) return 0;
  return Number((amountInSle / rate).toFixed(2));
}

/**
 * Convert USD to SLE (Leones).
 */
export function usdToSle(amountInUsd: number): number {
  const rate = getUsdToSleRate();
  if (amountInUsd <= 0) return 0;
  return Number((amountInUsd * rate).toFixed(2));
}

/**
 * Convert amount between SLE and USD.
 */
export function convertCurrency(
  amount: number,
  from: "SLE" | "USD",
  to: "SLE" | "USD"
): number {
  if (from === to) return amount;
  if (from === "SLE" && to === "USD") {
    return sleToUsd(amount);
  }
  return usdToSle(amount);
}

/**
 * Format currency with appropriate symbol.
 */
export function formatCurrencyAmount(amount: number, currency: "SLE" | "USD" | string): string {
  if (currency === "USD") {
    return `$ ${amount.toFixed(2)} USD`;
  }
  return `NLe ${amount.toFixed(2)} SLE`;
}
