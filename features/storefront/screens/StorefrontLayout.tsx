"use client"

import { useState } from "react"
import { StoreHeader } from "@/features/storefront/components/StoreHeader"
import { CartSidebar } from "@/features/storefront/components/CartSidebar"
import { StripeCheckoutModal } from "@/features/storefront/components/StripeCheckoutModal"
import { type StoreInfo } from "@/features/storefront/lib/store-data"
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
                <p>Mon-Thu: {storeInfo.hours?.monday || '11 AM - 10 PM'}</p>
                <p>Fri-Sat: {storeInfo.hours?.friday || '11 AM - 11 PM'}</p>
                <p>Sunday: {storeInfo.hours?.sunday || '10 AM - 9 PM'}</p>
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
