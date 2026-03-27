"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { updateLineItem, removeLineItem } from "@/features/storefront/lib/data/cart"
import { useRouter } from "next/navigation"

interface CartItem {
  id: string
  quantity: number
  specialInstructions?: string
  menuItem: {
    id: string
    name: string
    price: number
    thumbnail?: string | null
  }
  modifiers: Array<{
    id: string
    name: string
    priceAdjustment: number
  }>
}

interface CartData {
  id: string
  orderType?: string
  subtotal: number
  items: CartItem[]
}

interface CartDropdownProps {
  cart: CartData | null
  currencyCode: string
  locale: string
}

export default function CartDropdown({ cart, currencyCode, locale }: CartDropdownProps) {
  const router = useRouter()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const items = cart?.items || []
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart?.subtotal || 0

  // Auto-open cart when items are added
  const prevItemCount = useRef(itemCount)
  useEffect(() => {
    if (itemCount > prevItemCount.current) {
      setIsCartOpen(true)
    }
    prevItemCount.current = itemCount
  }, [itemCount])

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return
    setIsUpdating(true)
    try {
      await updateLineItem({ cartId: cart?.id || "", lineId: cartItemId, quantity })
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
    setIsUpdating(false)
  }

  const handleRemoveItem = async (cartItemId: string) => {
    setIsUpdating(true)
    try {
      await removeLineItem({ cartId: cart?.id || "", lineId: cartItemId })
    } catch (error) {
      console.error("Error removing item:", error)
    }
    setIsUpdating(false)
  }

  const currencyConfig = { currencyCode, locale }

  return (
    <>
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="hidden sm:inline">Order</span>
        <div className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-warm-500 text-white text-[10px] font-bold flex items-center justify-center min-w-[18px]">
              {itemCount}
            </span>
          )}
        </div>
      </button>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border/50">
          <SheetHeader className="px-6 py-5 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-serif font-bold text-2xl tracking-tight">Your Order</SheetTitle>
              {itemCount > 0 && (
                <span className="text-xs font-semibold bg-muted rounded-full px-3 py-1 text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-serif font-semibold text-xl mb-1.5">Your order is empty</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">Browse our menu and add some delicious items</p>
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full px-6 text-sm font-medium"
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-5">
                  {items.map((item) => {
                    const modifiersTotal = item.modifiers.reduce((sum, m) => sum + (m.priceAdjustment || 0), 0)
                    const itemPrice = (Number(item.menuItem.price) + modifiersTotal) * item.quantity

                    return (
                      <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-muted/40 border border-border/30">
                        <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={item.menuItem.thumbnail || "/placeholder.jpg"}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif font-semibold text-sm leading-snug">{item.menuItem.name}</h4>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {item.modifiers.length > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                              {item.modifiers.map((m) => m.name).join(", ")}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-[11px] text-muted-foreground italic mt-0.5">"{item.specialInstructions}"</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-border rounded-lg overflow-hidden">
                              <button
                                className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs w-7 text-center font-semibold tabular-nums">{item.quantity}</span>
                              <button
                                className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold tabular-nums">{formatCurrency(itemPrice, currencyConfig)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              <div className="border-t border-border/50 p-6 space-y-4 bg-muted/30">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal, currencyConfig)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (estimated)</span>
                    <span className="tabular-nums">{formatCurrency(subtotal * 0.0875, currencyConfig)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <span className="font-serif font-bold text-lg">Total</span>
                  <span className="font-serif font-bold text-lg tabular-nums">{formatCurrency(subtotal * 1.0875, currencyConfig)}</span>
                </div>
                <Button
                  className="w-full h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 shadow-sm gap-2"
                  onClick={() => {
                    setIsCartOpen(false)
                    router.push("/checkout?step=contact")
                  }}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
