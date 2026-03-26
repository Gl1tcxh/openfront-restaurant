"use client"

import { ArrowDown } from "lucide-react"
import { type StoreInfo } from "@/features/storefront/lib/store-data"

interface HeroBannerProps {
  onOrderNow: () => void
  storeInfo: StoreInfo
}

export function HeroBanner({ onOrderNow, storeInfo }: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-warm-800 text-primary-foreground">
      {/* Atmospheric background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] rounded-full bg-warm-600/20 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] rounded-full bg-warm-700/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-warm-500/10 blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 py-20 md:py-28 lg:py-36">
        <div className="max-w-3xl">
          {/* Tagline chip */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 mb-8 border border-primary-foreground/10">
            <div className="h-1.5 w-1.5 rounded-full bg-warm-500 animate-pulse" />
            <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-primary-foreground/80">
              {storeInfo.heroTagline || "Now Serving"}
            </span>
          </div>

          <h1 className="font-serif font-bold text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.92] tracking-tight mb-6">
            {storeInfo.heroHeadline || storeInfo.name}
          </h1>

          <p className="text-lg md:text-xl max-w-lg text-primary-foreground/75 leading-relaxed mb-12">
            {storeInfo.heroSubheadline || storeInfo.tagline}
          </p>

          <button
            onClick={onOrderNow}
            className="group inline-flex items-center gap-3 bg-primary-foreground text-primary rounded-full px-8 py-4 text-sm font-semibold tracking-wide hover:bg-primary-foreground/90 transition-all hover:shadow-lg hover:shadow-primary-foreground/10"
          >
            View Our Menu
            <ArrowDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  )
}
