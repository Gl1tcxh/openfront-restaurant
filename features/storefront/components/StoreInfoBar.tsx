"use client"

import { type StoreInfo, type DayHours } from "@/features/storefront/lib/store-data"

interface StoreInfoBarProps {
  storeInfo: StoreInfo
}

export function StoreInfoBar({ storeInfo }: StoreInfoBarProps) {
  const parseHours = (value: string | DayHours | undefined): DayHours | null => {
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

      const [open, close] = value.split("-").map((s) => s.trim())
      if (!open || !close) return null
      return { enabled: true, ranges: [{ open, close }] }
    }

    return null
  }

  const formatDisplayTime = (time: string) => {
    if (!time) return ""

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

    const d = new Date()
    d.setHours(h, m, 0, 0)
    try {
      return new Intl.DateTimeFormat(storeInfo.locale || "en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: storeInfo.timezone || "UTC",
      }).format(d)
    } catch {
      return time
    }
  }

  // Get current day's open/close summary
  const getOpenStatusSummary = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = days[new Date().getDay()]
    const parsed = parseHours(storeInfo.hours?.[today as keyof typeof storeInfo.hours])

    if (!parsed || parsed.enabled === false || !parsed.ranges?.length) {
      return "Closed today"
    }

    const first = parsed.ranges[0]
    return `Open ${formatDisplayTime(first.open)} – ${formatDisplayTime(first.close)}`
  }

  return (
    <div className="border-b border-border">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span>{storeInfo.address}</span>
            <span className="hidden md:inline">·</span>
            <span>{storeInfo.phone}</span>
            <span className="hidden md:inline">·</span>
            <span>{getOpenStatusSummary()}</span>
          </div>
          {storeInfo.rating && storeInfo.reviewCount ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{storeInfo.rating}</span>
              <span className="text-primary">★★★★★</span>
              <span className="text-muted-foreground">({storeInfo.reviewCount.toLocaleString()})</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
