import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import type { DayHours } from "@/features/storefront/lib/store-data"

function parseHours(value: string | DayHours | undefined): DayHours | null {
  if (!value) return null

  if (typeof value === "object") {
    if (value.ranges?.length) return { ...value, enabled: value.enabled ?? true }
    if (value.open && value.close) {
      return {
        enabled: value.enabled ?? true,
        ranges: [{ open: value.open, close: value.close }],
      }
    }
    return value.enabled === false ? { enabled: false, ranges: [] } : null
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === "closed") {
      return { enabled: false, ranges: [] }
    }
    const [open, close] = normalized.split("-").map((s: string) => s.trim())
    if (!open || !close) return null
    return { enabled: true, ranges: [{ open, close }] }
  }

  return null
}

function formatTime(time: string, locale: string, timezone: string): string {
  const normalized = time.trim().toLowerCase()
  const meridianMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)

  let h = 0
  let m = 0

  if (meridianMatch) {
    h = Number.parseInt(meridianMatch[1], 10)
    m = Number.parseInt(meridianMatch[2] || "0", 10)
    const meridian = meridianMatch[3]
    if (meridian === 'pm' && h < 12) h += 12
    if (meridian === 'am' && h === 12) h = 0
  } else {
    const hhmm = normalized.includes(":") ? normalized : `${normalized}:00`
    const [hRaw, mRaw] = hhmm.split(":")
    h = Number.parseInt(hRaw, 10)
    m = Number.parseInt(mRaw || "0", 10)
  }

  if (Number.isNaN(h) || Number.isNaN(m)) return time

  const date = new Date()
  date.setHours(h, m, 0, 0)

  try {
    return new Intl.DateTimeFormat(locale || "en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone || "UTC",
    }).format(date)
  } catch {
    return time
  }
}

const dayOrder: Array<string> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

export default async function Footer() {
  const storeSettings = await getStoreSettings()
  const storeName = storeSettings?.name || "Restaurant"
  const tagline = storeSettings?.heroSubheadline || storeSettings?.tagline || ""
  const address = storeSettings?.address || ""
  const phone = storeSettings?.phone || ""
  const hours = storeSettings?.hours || {}
  const locale = storeSettings?.locale || "en-US"
  const timezone = storeSettings?.timezone || "America/New_York"

  const footerHours = dayOrder.map((day) => {
    const parsed = parseHours((hours as any)?.[day])
    const label = day.charAt(0).toUpperCase() + day.slice(1, 3)

    if (!parsed || parsed.enabled === false || !parsed.ranges?.length) {
      return { day: label, value: "Closed" }
    }

    const first = parsed.ranges[0]
    return {
      day: label,
      value: `${formatTime(first.open, locale, timezone)} – ${formatTime(first.close, locale, timezone)}`,
    }
  })

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="font-serif text-2xl mb-4">{storeName}</h3>
            {tagline && (
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                {tagline}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wide mb-4">Hours</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {footerHours.map((entry) => (
                <p key={entry.day}>{entry.day}: {entry.value}</p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wide mb-4">Contact</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {address && <p>{address}</p>}
              {phone && <p>{phone}</p>}
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
