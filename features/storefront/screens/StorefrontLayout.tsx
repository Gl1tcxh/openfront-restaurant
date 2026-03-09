"use client"

import { useState } from "react"
import { StoreHeader } from "@/features/storefront/components/StoreHeader"
import { CartSidebar } from "@/features/storefront/components/CartSidebar"
import { StripeCheckoutModal } from "@/features/storefront/components/StripeCheckoutModal"
import { type StoreInfo, type DayHours } from "@/features/storefront/lib/store-data"
import { usePathname } from "next/navigation"

interface StorefrontLayoutProps {
  children: React.ReactNode
  storeInfo: StoreInfo | null
  user: any
}

export default function StorefrontLayout({ children, storeInfo, user }: StorefrontLayoutProps) {
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const pathname = usePathname()

  if (!storeInfo) return <>{children}</>

  const isHomePage = pathname === "/"

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

  const formatTime = (time: string) => {
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
      return new Intl.DateTimeFormat(storeInfo.locale || "en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: storeInfo.timezone || "UTC",
      }).format(date)
    } catch {
      return time
    }
  }

  const dayOrder: Array<keyof StoreInfo["hours"]> = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]

  const footerHours = dayOrder.map((day) => {
    const parsed = parseHours(storeInfo.hours?.[day])
    const label = day.charAt(0).toUpperCase() + day.slice(1, 3)

    if (!parsed || parsed.enabled === false || !parsed.ranges?.length) {
      return { day: label, value: "Closed" }
    }

    const first = parsed.ranges[0]
    return {
      day: label,
      value: `${formatTime(first.open)} – ${formatTime(first.close)}`,
    }
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background">
        <StoreHeader 
          orderType={orderType} 
          setOrderType={isHomePage ? setOrderType : undefined} 
          storeInfo={storeInfo} 
          user={user} 
        />
      </div>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-serif text-2xl mb-4">{storeInfo.name}</h3>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                {storeInfo.heroSubheadline || storeInfo.tagline}
              </p>
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
                <p>{storeInfo.address}</p>
                <p>{storeInfo.phone}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {storeInfo.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Common Sidebars & Modals */}
      <CartSidebar 
        orderType={orderType} 
        onCheckout={() => setIsCheckoutOpen(true)} 
        storeInfo={storeInfo} 
      />
      <StripeCheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        orderType={orderType} 
        storeInfo={storeInfo} 
        user={user} 
      />
    </div>
  )
}
