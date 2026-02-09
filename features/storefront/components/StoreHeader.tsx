"use client"

import { ShoppingBag, Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/features/storefront/lib/cart-context"
import { type StoreInfo } from "@/features/storefront/lib/store-data"
import { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StoreHeaderProps {
  orderType?: "pickup" | "delivery"
  setOrderType?: (type: "pickup" | "delivery") => void
  storeInfo: StoreInfo
  user?: any
  hideCart?: boolean
}

export function StoreHeader({ orderType, setOrderType, storeInfo, user, hideCart }: StoreHeaderProps) {
  const { itemCount, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const canToggleOrderType = Boolean(setOrderType)
  const currentOrderType = orderType ?? "pickup"

  return (
    <header className="bg-background/95 backdrop-blur-sm">
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
              {canToggleOrderType && (
                <>
                  <button
                    onClick={() => setOrderType?.("pickup")}
                    className={cn(
                      "text-sm tracking-wide uppercase transition-colors",
                      currentOrderType === "pickup" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Pickup
                  </button>
                  <button
                    onClick={() => setOrderType?.("delivery")}
                    className={cn(
                      "text-sm tracking-wide uppercase transition-colors",
                      currentOrderType === "delivery" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Delivery
                  </button>
                </>
              )}
              <Link
                href="/account"
                className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                Account
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {!hideCart && (
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
              )}

              {user ? (
                <Link href="/account" className="hidden sm:flex items-center gap-2 text-sm tracking-wide uppercase hover:text-primary transition-colors">
                  <User className="h-5 w-5" />
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link href="/account" className="hidden sm:flex items-center gap-2 text-sm tracking-wide uppercase hover:text-primary transition-colors">
                  Sign In
                </Link>
              )}

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
            {canToggleOrderType && (
              <>
                <button
                  onClick={() => {
                    setOrderType?.("pickup")
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    "block w-full text-left text-sm tracking-wide uppercase py-2",
                    currentOrderType === "pickup" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  Pickup · {storeInfo.estimatedPickup}
                </button>
                <button
                  onClick={() => {
                    setOrderType?.("delivery")
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    "block w-full text-left text-sm tracking-wide uppercase py-2",
                    currentOrderType === "delivery" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  Delivery · {storeInfo.estimatedDelivery}
                </button>
              </>
            )}
            <Link
              href="/account"
              className="block w-full text-left text-sm tracking-wide uppercase py-2 text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Account
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
