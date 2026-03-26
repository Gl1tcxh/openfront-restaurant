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
    menuItemImages?: Array<{
      id: string
      image?: { url: string }
      imagePath?: string
    }>
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

function getImageUrl(menuItem: CartItem["menuItem"]): string {
  const firstImage = menuItem.menuItemImages?.[0]
  if (firstImage?.image?.url) return firstImage.image.url
  if (firstImage?.imagePath) return firstImage.imagePath
  return '/placeholder.jpg'
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

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background">
          <SheetHeader className="px-6 py-6 border-b border-border">
            <SheetTitle className="font-serif text-2xl">Your Bag</SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="font-serif text-xl mb-2">Your bag is empty</p>
              <p className="text-sm text-muted-foreground mb-6">Add some items to get started</p>
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(false)}
                className="uppercase tracking-widest text-xs"
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {items.map((item) => {
                    const modifiersTotal = item.modifiers.reduce((sum, m) => sum + (m.priceAdjustment || 0), 0)
                    const itemPrice = (Number(item.menuItem.price) + modifiersTotal) * item.quantity

                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 bg-muted">
                          <Image
                            src={getImageUrl(item.menuItem)}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif text-sm">{item.menuItem.name}</h4>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {item.modifiers.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.modifiers.map((m) => m.name).join(", ")}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="text-xs text-muted-foreground italic mt-1">"{item.specialInstructions}"</p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-border">
                              <button
                                className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm w-8 text-center">{item.quantity}</span>
                              <button
                                className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-sm">{formatCurrency(itemPrice, currencyConfig)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              <div className="border-t border-border p-6 space-y-4 bg-muted/30">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order Summary</span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal, currencyConfig)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(subtotal * 0.0875, currencyConfig)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-serif text-lg pt-4 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal * 1.0875, currencyConfig)}</span>
                </div>
                <Button
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
                  onClick={() => {
                    setIsCartOpen(false)
                    router.push("/checkout?step=contact")
                  }}
                >
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
