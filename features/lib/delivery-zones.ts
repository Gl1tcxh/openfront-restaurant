export function normalizeCountryCode(value?: string | null) {
  return (value || "").trim().toUpperCase()
}

export function normalizePostalCode(value?: string | null) {
  return (value || "").trim().toUpperCase().replace(/[\s-]+/g, "")
}

export function parseDeliveryPostalCodes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizePostalCode(String(entry ?? "")))
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => normalizePostalCode(entry))
      .filter(Boolean)
  }

  return []
}

export function getUniqueDeliveryPostalCodes(value: unknown): string[] {
  return Array.from(new Set(parseDeliveryPostalCodes(value)))
}

export function inferDefaultDeliveryPostalCodes(params: {
  deliveryPostalCodes?: unknown
  address?: string | null
}) {
  const configured = getUniqueDeliveryPostalCodes(params.deliveryPostalCodes)
  if (configured.length > 0) {
    return configured
  }

  const address = params.address || ""
  const match = address.match(/([A-Z0-9][A-Z0-9 -]{2,10})\s*$/i)
  if (!match?.[1]) {
    return []
  }

  const postalCode = normalizePostalCode(match[1])
  return postalCode ? [postalCode] : []
}

export function getDeliveryEligibility(params: {
  deliveryEnabled?: boolean | null
  storeCountryCode?: string | null
  deliveryPostalCodes?: unknown
  addressCountryCode?: string | null
  addressPostalCode?: string | null
}) {
  const deliveryEnabled = Boolean(params.deliveryEnabled)
  const storeCountryCode = normalizeCountryCode(params.storeCountryCode)
  const addressCountryCode = normalizeCountryCode(params.addressCountryCode)
  const addressPostalCode = normalizePostalCode(params.addressPostalCode)
  const allowedPostalCodes = getUniqueDeliveryPostalCodes(params.deliveryPostalCodes)

  if (!deliveryEnabled) {
    return {
      eligible: false,
      reason: "delivery_disabled" as const,
      allowedPostalCodes,
      normalizedPostalCode: addressPostalCode,
    }
  }

  if (!addressCountryCode || !addressPostalCode) {
    return {
      eligible: false,
      reason: "missing_address" as const,
      allowedPostalCodes,
      normalizedPostalCode: addressPostalCode,
    }
  }

  if (storeCountryCode && addressCountryCode !== storeCountryCode) {
    return {
      eligible: false,
      reason: "country_mismatch" as const,
      allowedPostalCodes,
      normalizedPostalCode: addressPostalCode,
    }
  }

  if (allowedPostalCodes.length === 0) {
    return {
      eligible: false,
      reason: "missing_delivery_zones" as const,
      allowedPostalCodes,
      normalizedPostalCode: addressPostalCode,
    }
  }

  if (!allowedPostalCodes.includes(addressPostalCode)) {
    return {
      eligible: false,
      reason: "postal_code_outside_zone" as const,
      allowedPostalCodes,
      normalizedPostalCode: addressPostalCode,
    }
  }

  return {
    eligible: true,
    reason: "eligible" as const,
    allowedPostalCodes,
    normalizedPostalCode: addressPostalCode,
  }
}
