"use client"

import { ShoppingBag, User } from "lucide-react"
import { useCartData } from "@/features/storefront/lib/hooks/use-cart"
import { type StoreInfo } from "@/features/storefront/lib/store-data"
import Link from "next/link"

interface StoreHeaderProps {
  storeInfo: StoreInfo
  user?: any
  hideCart?: boolean
  onOpenCart?: () => void
}

export function StoreHeader({ storeInfo, user, hideCart, onOpenCart }: StoreHeaderProps) {
  const { itemCount } = useCartData()

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

            {/* Right side */}
            <div className="flex items-center gap-4">
              {!hideCart && (
                <button
                  onClick={() => onOpenCart?.()}
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

            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
