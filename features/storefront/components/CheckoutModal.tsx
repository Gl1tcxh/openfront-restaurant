"use client"

import { useState } from "react"
import { CreditCard, MapPin, Clock, CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/features/storefront/lib/cart-context"
import { type StoreInfo } from "@/features/storefront/lib/store-data"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  orderType: "pickup" | "delivery"
  storeInfo: StoreInfo
}

type CheckoutStep = "details" | "payment" | "confirmation"

export function CheckoutModal({ isOpen, onClose, orderType, storeInfo }: CheckoutModalProps) {
  const { subtotal, clearCart, items } = useCart()
  const [step, setStep] = useState<CheckoutStep>("details")
  const [tipPercent, setTipPercent] = useState(18)

  const deliveryFee = orderType === "delivery" ? storeInfo.deliveryFee : 0
  const discount = orderType === "pickup" ? subtotal * (storeInfo.pickupDiscount / 100) : 0
  const tax = (subtotal - discount) * 0.0875
  const tip = (subtotal - discount) * (tipPercent / 100)
  const total = subtotal - discount + deliveryFee + tax + tip

  const handlePlaceOrder = () => {
    setStep("confirmation")
  }

  const handleClose = () => {
    if (step === "confirmation") {
      clearCart()
    }
    setStep("details")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 bg-background">
        {step === "confirmation" ? (
          <div className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl mb-2">Order Confirmed</h2>
            <p className="text-muted-foreground mb-6">Order #{Math.floor(Math.random() * 9000) + 1000}</p>
            <div className="bg-muted p-4 mb-8">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Estimated {orderType === "pickup" ? "pickup" : "delivery"}:{" "}
                  <strong>{orderType === "pickup" ? storeInfo.estimatedPickup : storeInfo.estimatedDelivery}</strong>
                </span>
              </div>
            </div>
            <Button
              onClick={handleClose}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-6 border-b border-border">
              <div className="flex items-center gap-4">
                {step === "payment" && (
                  <button onClick={() => setStep("details")} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <h2 className="font-serif text-2xl">{step === "details" ? "Checkout" : "Payment"}</h2>
              </div>
            </div>

            <div className="p-6">
              {step === "details" ? (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-wide">Contact</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-xs text-muted-foreground">
                          First Name
                        </Label>
                        <Input id="firstName" placeholder="John" className="mt-1 border-border" />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs text-muted-foreground">
                          Last Name
                        </Label>
                        <Input id="lastName" placeholder="Doe" className="mt-1 border-border" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-muted-foreground">
                        Email
                      </Label>
                      <Input id="email" type="email" placeholder="john@example.com" className="mt-1 border-border" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs text-muted-foreground">
                        Phone
                      </Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" className="mt-1 border-border" />
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {orderType === "delivery" && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h3>
                      <div>
                        <Label htmlFor="address" className="text-xs text-muted-foreground">
                          Street Address
                        </Label>
                        <Input id="address" placeholder="123 Main St" className="mt-1 border-border" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Label htmlFor="city" className="text-xs text-muted-foreground">
                            City
                          </Label>
                          <Input id="city" placeholder="Brooklyn" className="mt-1 border-border" />
                        </div>
                        <div>
                          <Label htmlFor="zip" className="text-xs text-muted-foreground">
                            ZIP
                          </Label>
                          <Input id="zip" placeholder="11201" className="mt-1 border-border" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pickup Location */}
                  {orderType === "pickup" && (
                    <div className="bg-muted p-4">
                      <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        Pickup Location
                      </h3>
                      <p className="text-sm">{storeInfo.address}</p>
                      <p className="text-sm text-muted-foreground mt-1">Ready in {storeInfo.estimatedPickup}</p>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
                    onClick={() => setStep("payment")}
                  >
                    Continue to Payment
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment
                    </h3>
                    <div>
                      <Label htmlFor="cardNumber" className="text-xs text-muted-foreground">
                        Card Number
                      </Label>
                      <Input id="cardNumber" placeholder="4242 4242 4242 4242" className="mt-1 border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="expiry" className="text-xs text-muted-foreground">
                          Expiry
                        </Label>
                        <Input id="expiry" placeholder="MM/YY" className="mt-1 border-border" />
                      </div>
                      <div>
                        <Label htmlFor="cvc" className="text-xs text-muted-foreground">
                          CVC
                        </Label>
                        <Input id="cvc" placeholder="123" className="mt-1 border-border" />
                      </div>
                    </div>
                  </div>

                  {/* Tip Selection */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-wide">Add a Tip</h3>
                    <RadioGroup
                      value={tipPercent.toString()}
                      onValueChange={(val) => setTipPercent(Number.parseInt(val))}
                      className="flex gap-2"
                    >
                      {[0, 15, 18, 20, 25].map((percent) => (
                        <div key={percent} className="flex-1">
                          <RadioGroupItem value={percent.toString()} id={`tip-${percent}`} className="peer sr-only" />
                          <Label
                            htmlFor={`tip-${percent}`}
                            className="flex flex-col items-center justify-center border border-border p-3 hover:bg-muted peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted cursor-pointer text-center transition-colors"
                          >
                            <span className="text-sm font-medium">{percent}%</span>
                            <span className="text-xs text-muted-foreground">
                              ${((subtotal - discount) * (percent / 100)).toFixed(2)}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-2 text-sm border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({items.length})</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Pickup Discount</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tip</span>
                      <span>${tip.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-serif text-lg pt-4 border-t border-border">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
                    onClick={handlePlaceOrder}
                  >
                    Place Order · ${total.toFixed(2)}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
