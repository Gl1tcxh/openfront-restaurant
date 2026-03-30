"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { updateLineItem, removeLineItem } from "@/features/storefront/lib/data/cart"
import { useRouter } from "next/navigation"
import LineItemDisplay from "@/features/storefront/modules/common/components/line-item-display"

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
        <span className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          ) : null}
        </span>
      </button>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border/50">
          <SheetHeader className="px-6 py-5 border-b border-border/50">
            <SheetTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Your Order</SheetTitle>
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
                <div className="p-6 divide-y divide-border/50">
                  {items.map((item) => {
                    return (
                      <LineItemDisplay
                        key={item.id}
                        item={item}
                        currencyCode={currencyCode}
                        locale={locale}
                        editable
                        isUpdating={isUpdating}
                        onRemove={handleRemoveItem}
                        onIncrease={handleUpdateQuantity}
                        onDecrease={handleUpdateQuantity}
                        className="rounded-none border-0 bg-transparent px-0 py-4 first:pt-0 last:pb-0"
                      />
                    )
                  })}
                </div>
              </ScrollArea>

              <div className="border-t border-border/50 p-6 space-y-4 bg-muted/30">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal, currencyConfig)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (estimated)</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal * 0.0875, currencyConfig)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-medium">Total</span>
                  <span className="font-medium tabular-nums">{formatCurrency(subtotal * 1.0875, currencyConfig)}</span>
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
