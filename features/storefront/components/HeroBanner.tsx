"use client"

import { ArrowDown } from "lucide-react"
import { type StoreInfo } from "@/features/storefront/lib/store-data"

interface HeroBannerProps {
  onOrderNow: () => void
  storeInfo: StoreInfo
}

export function HeroBanner({ onOrderNow, storeInfo }: HeroBannerProps) {
  return (
    <section className="relative bg-primary text-primary-foreground overflow-hidden">
      {/* Large editorial typography */}
      <div className="container mx-auto px-6 py-24 md:py-32 lg:py-40">
        <div className="max-w-4xl">
          <p className="text-sm tracking-widest uppercase mb-6 opacity-80">
            {storeInfo.heroTagline || "Welcome"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight mb-8">
            {storeInfo.heroHeadline || storeInfo.name}
          </h1>
          <p className="text-lg md:text-xl max-w-md opacity-90 leading-relaxed mb-10">
            {storeInfo.heroSubheadline || storeInfo.tagline}
          </p>
          <button
            onClick={onOrderNow}
            className="group inline-flex items-center gap-3 text-sm tracking-widest uppercase border-b border-primary-foreground/50 pb-2 hover:border-primary-foreground transition-colors"
          >
            View Menu
            <ArrowDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
        <div className="absolute inset-0 bg-gradient-to-l from-background/20 to-transparent" />
      </div>
    </section>
  )
}
