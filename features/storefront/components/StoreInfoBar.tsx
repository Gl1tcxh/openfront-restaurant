"use client"

import { type StoreInfo } from "@/features/storefront/lib/store-data"

interface StoreInfoBarProps {
  storeInfo: StoreInfo
}

export function StoreInfoBar({ storeInfo }: StoreInfoBarProps) {
  // Get current day's closing time
  const getCurrentClosingTime = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = days[new Date().getDay()]
    const hours = storeInfo.hours?.[today as keyof typeof storeInfo.hours]
    if (hours) {
      const match = hours.match(/- (.+)$/)
      return match ? match[1] : '10 PM'
    }
    return '10 PM'
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
            <span>Open until {getCurrentClosingTime()}</span>
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
