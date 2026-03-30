import { normalizeCountryCode, normalizePostalCode } from "@/features/lib/delivery-zones"

const normalizeText = (value?: string | null) => (value || "").trim().toUpperCase()

const getCountryCode = (address: any) =>
  normalizeCountryCode(
    address?.countryCode || address?.country?.iso2 || address?.country
  )

const getState = (address: any) =>
  normalizeText(address?.state || address?.province)

export default function compareAddresses(address1: any, address2: any): boolean {
  if (!address1 || !address2) return false

  return (
    normalizeText(address1.address1) === normalizeText(address2.address1) &&
    normalizeText(address1.address2) === normalizeText(address2.address2) &&
    normalizeText(address1.city) === normalizeText(address2.city) &&
    getState(address1) === getState(address2) &&
    normalizePostalCode(address1.postalCode || address1.deliveryZip) ===
      normalizePostalCode(address2.postalCode || address2.deliveryZip) &&
    getCountryCode(address1) === getCountryCode(address2)
  )
}
