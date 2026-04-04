import { Clock3, MapPin, Phone, Star, Truck } from "lucide-react"
import { type StoreInfo, type DayHours } from "@/features/storefront/lib/store-data"
import { formatCurrency } from "@/features/storefront/lib/currency"

interface StoreInfoBarProps {
  storeInfo: StoreInfo
}

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
    if (!normalized || normalized === "closed") return { enabled: false, ranges: [] }
    const [open, close] = value.split("-").map((segment) => segment.trim())
    if (!open || !close) return null
    return { enabled: true, ranges: [{ open, close }] }
  }

  return null
}

function formatDisplayTime(time: string, locale: string, timezone: string) {
  if (!time) return ""

  const normalized = time.trim().toLowerCase()
  const meridianMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/)

  let hours = 0
  let minutes = 0

  if (meridianMatch) {
    hours = Number.parseInt(meridianMatch[1], 10)
    minutes = Number.parseInt(meridianMatch[2] || "0", 10)
    const meridian = meridianMatch[3]
    if (meridian === "pm" && hours < 12) hours += 12
    if (meridian === "am" && hours === 12) hours = 0
  } else {
    const hhmm = normalized.includes(":") ? normalized : `${normalized}:00`
    const [hRaw, mRaw] = hhmm.split(":")
    hours = Number.parseInt(hRaw, 10)
    minutes = Number.parseInt(mRaw || "0", 10)
  }

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

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

export function StoreInfoBar({ storeInfo }: StoreInfoBarProps) {
  const getOpenStatus = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const today = days[new Date().getDay()]
    const parsed = parseHours(storeInfo.hours?.[today as keyof typeof storeInfo.hours])

    if (!parsed || parsed.enabled === false || !parsed.ranges?.length) {
      return { isOpen: false, text: "Closed today" }
    }

    const first = parsed.ranges[0]
    return {
      isOpen: true,
      text: `${formatDisplayTime(first.open, storeInfo.locale || "en-US", storeInfo.timezone || "UTC")} – ${formatDisplayTime(first.close, storeInfo.locale || "en-US", storeInfo.timezone || "UTC")}`,
    }
  }

  const status = getOpenStatus()

  return (
    <section className="border-y border-border bg-background">
      <div className="storefront-shell py-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="storefront-surface-soft flex items-center gap-3 px-4 py-3">
            <span className={`size-2 rounded-full ${status.isOpen ? "bg-emerald-500" : "bg-destructive"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">{status.isOpen ? "Open now" : "Closed"}</p>
              <p className="text-sm text-muted-foreground">{status.text}</p>
            </div>
          </div>

          {storeInfo.address ? (
            <div className="storefront-surface-soft flex items-center gap-3 px-4 py-3">
              <MapPin className="size-4 text-primary" />
              <p className="text-sm text-muted-foreground">{storeInfo.address}</p>
            </div>
          ) : null}

          {storeInfo.phone ? (
            <div className="storefront-surface-soft flex items-center gap-3 px-4 py-3">
              <Phone className="size-4 text-primary" />
              <p className="text-sm text-muted-foreground">{storeInfo.phone}</p>
            </div>
          ) : null}

          <div className="storefront-surface-soft flex items-center gap-3 px-4 py-3">
            {storeInfo.deliveryEnabled ? <Truck className="size-4 text-primary" /> : <Clock3 className="size-4 text-primary" />}
            <p className="text-sm text-muted-foreground">
              {storeInfo.deliveryEnabled
                ? `${storeInfo.estimatedDelivery || "Delivery available"} · ${formatCurrency(storeInfo.deliveryFee, { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }, { inputIsCents: false })}`
                : storeInfo.estimatedPickup || "Pickup available"}
            </p>
          </div>
        </div>

        {storeInfo.rating && storeInfo.reviewCount ? (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <Star className="size-4 fill-primary text-primary" />
            <span className="font-medium text-foreground">{storeInfo.rating}</span>
            <span>from {storeInfo.reviewCount.toLocaleString()} reviews</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
