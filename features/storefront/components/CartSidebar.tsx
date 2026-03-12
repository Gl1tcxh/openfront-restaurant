"use client"

import Image from "next/image"
import { Minus, Plus, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useCartData, useRemoveCartItem, useUpdateCartItemQuantity, useClearCart } from "@/features/storefront/lib/hooks/use-cart"
import { type StoreInfo, type MenuItem } from "@/features/storefront/lib/store-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/features/storefront/lib/currency"

interface CartSidebarProps {
  orderType: "pickup" | "delivery"
  onOrderTypeChange: (type: "pickup" | "delivery") => void
  onCheckout: () => void
  storeInfo: StoreInfo
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

// Helper function to get image URL
function getImageUrl(item: MenuItem): string {
  const firstImage = item.menuItemImages?.[0]
  if (firstImage?.image?.url) return firstImage.image.url
  if (firstImage?.imagePath) return firstImage.imagePath
  return '/placeholder.jpg'
}

export function CartSidebar({ orderType, onOrderTypeChange, onCheckout, storeInfo, isOpen, onOpenChange }: CartSidebarProps) {
  const currencyConfig = { currencyCode: storeInfo.currencyCode, locale: storeInfo.locale }
  const { items, subtotal } = useCartData()
  const removeItemMutation = useRemoveCartItem()
  const updateQuantityMutation = useUpdateCartItemQuantity()
  const clearCart = useClearCart()

  const deliveryFee = orderType === "delivery" ? storeInfo.deliveryFee : 0
  const discount = orderType === "pickup" ? subtotal * (storeInfo.pickupDiscount / 100) : 0
  const tax = (subtotal - discount) * 0.0875
  const total = subtotal - discount + deliveryFee + tax

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background">
        <SheetHeader className="px-6 py-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif text-2xl">Your Bag</SheetTitle>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => onOrderTypeChange("pickup")}
              className={orderType === "pickup" ? "text-foreground" : "opacity-45 transition-opacity hover:opacity-70"}
            >
              Pickup
            </button>
            <span aria-hidden="true" className="opacity-45">·</span>
            <button
              type="button"
              onClick={() => onOrderTypeChange("delivery")}
              className={orderType === "delivery" ? "text-foreground" : "opacity-45 transition-opacity hover:opacity-70"}
            >
              Delivery
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {orderType === "pickup" ? storeInfo.estimatedPickup : storeInfo.estimatedDelivery}
          </p>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <p className="font-serif text-xl mb-2">Your bag is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Add some items to get started</p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.price, 0)
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
                            onClick={() => removeItemMutation.mutate(item.id)}
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
                              className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                              onClick={() => updateQuantityMutation.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm w-8 text-center">{item.quantity}</span>
                            <button
                              className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                              onClick={() => updateQuantityMutation.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order Summary</span>
                <button
                  onClick={clearCart}
                  className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear Bag
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal, currencyConfig)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Pickup Discount</span>
                    <span>-{formatCurrency(discount, currencyConfig)}</span>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{formatCurrency(deliveryFee, currencyConfig)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(tax, currencyConfig)}</span>
                </div>
              </div>
              <div className="flex justify-between font-serif text-lg pt-4 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(total, currencyConfig)}</span>
              </div>
              <Button
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
                onClick={onCheckout}
              >
                Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
