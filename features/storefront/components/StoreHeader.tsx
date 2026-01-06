"use client"

import { ShoppingBag, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/features/storefront/lib/cart-context"
import { type StoreInfo } from "@/features/storefront/lib/store-data"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface StoreHeaderProps {
  orderType: "pickup" | "delivery"
  setOrderType: (type: "pickup" | "delivery") => void
  storeInfo: StoreInfo
}

export function StoreHeader({ orderType, setOrderType, storeInfo }: StoreHeaderProps) {
  const { itemCount, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-2">
          <p className="text-center text-xs tracking-widest uppercase text-muted-foreground">
            {storeInfo.promoBanner || `Free pickup discount · ${storeInfo.pickupDiscount}% off all pickup orders`}
          </p>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <span className="font-serif text-2xl tracking-tight">{storeInfo.name}</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setOrderType("pickup")}
                className={cn(
                  "text-sm tracking-wide uppercase transition-colors",
                  orderType === "pickup" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Pickup
              </button>
              <button
                onClick={() => setOrderType("delivery")}
                className={cn(
                  "text-sm tracking-wide uppercase transition-colors",
                  orderType === "delivery" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Delivery
              </button>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 text-sm tracking-wide uppercase hover:text-primary transition-colors"
              >
                <span className="hidden sm:inline">Bag</span>
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="container mx-auto px-6 py-4 space-y-3">
            <button
              onClick={() => {
                setOrderType("pickup")
                setMobileMenuOpen(false)
              }}
              className={cn(
                "block w-full text-left text-sm tracking-wide uppercase py-2",
                orderType === "pickup" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Pickup · {storeInfo.estimatedPickup}
            </button>
            <button
              onClick={() => {
                setOrderType("delivery")
                setMobileMenuOpen(false)
              }}
              className={cn(
                "block w-full text-left text-sm tracking-wide uppercase py-2",
                orderType === "delivery" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Delivery · {storeInfo.estimatedDelivery}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
