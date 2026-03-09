import type { StoreInfo } from "./store-data"

const NO_DIVISION_CURRENCIES = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

export interface CurrencyConfig {
  currencyCode?: string
  locale?: string
}

const DEFAULT_CONFIG: Required<CurrencyConfig> = {
  currencyCode: "USD",
  locale: "en-US",
}

export function getCurrencyConfig(storeInfo?: Partial<StoreInfo> | null): Required<CurrencyConfig> {
  return {
    currencyCode: storeInfo?.currencyCode || DEFAULT_CONFIG.currencyCode,
    locale: storeInfo?.locale || DEFAULT_CONFIG.locale,
  }
}

function shouldDivideBy100(currencyCode: string): boolean {
  return !NO_DIVISION_CURRENCIES.includes(currencyCode.toLowerCase())
}

function normalizeToMajorUnits(value: number, currencyCode: string, inputIsCents: boolean): number {
  if (!inputIsCents) return value
  return shouldDivideBy100(currencyCode) ? value / 100 : value
}

/**
 * Formats a monetary amount using locale + currency.
 * By default expects minor units (cents for USD/EUR, no-division currencies supported).
 */
export function formatCurrency(
  amount: number | string,
  config?: CurrencyConfig,
  options?: { inputIsCents?: boolean }
): string {
  const parsed = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (Number.isNaN(parsed)) {
    const fallback = config?.currencyCode || DEFAULT_CONFIG.currencyCode
    const locale = config?.locale || DEFAULT_CONFIG.locale
    return new Intl.NumberFormat(locale, { style: "currency", currency: fallback }).format(0)
  }

  const currencyCode = config?.currencyCode || DEFAULT_CONFIG.currencyCode
  const locale = config?.locale || DEFAULT_CONFIG.locale
  const inputIsCents = options?.inputIsCents ?? true

  const value = normalizeToMajorUnits(parsed, currencyCode, inputIsCents)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(value)
}

/**
 * Converts major unit value to minor units (e.g. 12.99 => 1299 for USD).
 */
export function toMinorUnits(value: number | string, currencyCode = DEFAULT_CONFIG.currencyCode): number {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value
  if (Number.isNaN(parsed)) return 0
  return shouldDivideBy100(currencyCode) ? Math.round(parsed * 100) : Math.round(parsed)
}

/**
 * Converts minor units to major units.
 */
export function fromMinorUnits(value: number | string, currencyCode = DEFAULT_CONFIG.currencyCode): number {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value
  if (Number.isNaN(parsed)) return 0
  return shouldDivideBy100(currencyCode) ? parsed / 100 : parsed
}
