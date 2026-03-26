"use client"

import { CircleCheck, MapPin, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { setCheckoutDelivery } from "@/features/storefront/lib/data/cart"

const Delivery = ({
  cart,
  customer,
  storeSettings,
}: {
  cart: any
  customer: any
  storeSettings: any
}) => {
  const user = customer
  const storeInfo = storeSettings || {}
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "delivery"

  const [isLoading, setIsLoading] = useState(false)
  const [addressInfo, setAddressInfo] = useState({
    address: cart?.deliveryAddress || user?.addresses?.find((a: any) => a.isDefault)?.address1 || "",
    city: cart?.deliveryCity || user?.addresses?.find((a: any) => a.isDefault)?.city || "",
    zip: cart?.deliveryZip || user?.addresses?.find((a: any) => a.isDefault)?.postalCode || "",
  })

  const orderType = cart?.orderType || "pickup"
  const isComplete = orderType === "pickup" || (addressInfo.address && addressInfo.city && addressInfo.zip)

  const handleEdit = () => {
    router.push(pathname + "?step=delivery")
  }

  const handleSubmit = async () => {
    if (!isComplete) return
    setIsLoading(true)

    try {
      const result = await setCheckoutDelivery({
        deliveryAddress: addressInfo.address,
        deliveryCity: addressInfo.city,
        deliveryZip: addressInfo.zip,
      })

      if (!result.success) {
        throw new Error(result.message || "Could not update delivery details")
      }

      router.push(pathname + "?step=payment")
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-warm-100 flex items-center justify-center">
            {orderType === "delivery" ? <Truck className="h-4 w-4 text-warm-700" /> : <MapPin className="h-4 w-4 text-warm-700" />}
          </div>
          <h2 className={cn("font-serif font-bold text-xl tracking-tight", { "text-muted-foreground": !isOpen && !isComplete })}>
            {orderType === "delivery" ? "Delivery Address" : "Pickup Location"}
          </h2>
          {!isOpen && isComplete && <CircleCheck className="h-4 w-4 text-green-600" />}
        </div>
        {!isOpen && isComplete && (
          <Button onClick={handleEdit} data-testid="edit-delivery-button" variant="ghost" size="sm" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Edit
          </Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-5">
          {orderType === "delivery" ? (
            <div className="space-y-4">
              {user && user.addresses?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Saved Addresses</p>
                  <div className="grid grid-cols-1 gap-2">
                    {user.addresses.map((address: any) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setAddressInfo({
                          address: address.address1 || "",
                          city: address.city || "",
                          zip: address.postalCode || "",
                        })}
                        className={cn(
                          "text-left p-3 border rounded-xl text-sm transition-all hover:bg-muted/50",
                          addressInfo.address === address.address1 ? "border-primary bg-primary/5" : "border-border"
                        )}
                      >
                        <p className="font-medium">{address.name}</p>
                        <p className="text-[13px] text-muted-foreground truncate">{address.address1}, {address.city}</p>
                      </button>
                    ))}
                  </div>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><Separator /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground text-[11px] tracking-wider">Or enter manually</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="address" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Street Address</Label>
                  <Input id="address" placeholder="123 Main St" className="mt-1.5 rounded-lg h-11" value={addressInfo.address} onChange={(e) => setAddressInfo(prev => ({ ...prev, address: e.target.value }))} data-testid="address-input" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="city" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">City</Label>
                    <Input id="city" placeholder="Brooklyn" className="mt-1.5 rounded-lg h-11" value={addressInfo.city} onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))} data-testid="city-input" />
                  </div>
                  <div>
                    <Label htmlFor="zip" className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">ZIP</Label>
                    <Input id="zip" placeholder="11201" className="mt-1.5 rounded-lg h-11" value={addressInfo.zip} onChange={(e) => setAddressInfo(prev => ({ ...prev, zip: e.target.value }))} data-testid="zip-input" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center border border-border/50 shrink-0">
                  <MapPin className="h-4 w-4 text-warm-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Pickup Location</h3>
                  <p className="text-sm text-muted-foreground">{storeInfo.address}</p>
                  {storeInfo.estimatedPickup && (
                    <p className="text-[13px] text-warm-600 font-medium mt-1">Ready in {storeInfo.estimatedPickup}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <Button size="lg" onClick={handleSubmit} disabled={!isComplete || isLoading} data-testid="submit-delivery-button" className="w-full rounded-xl h-12 font-semibold">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Payment
          </Button>
        </div>
      ) : (
        isComplete && (
          <div className="pl-11" data-testid="delivery-summary">
            {orderType === "delivery" ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Delivery Address</p>
                <p className="text-sm text-foreground">{addressInfo.address}</p>
                <p className="text-sm text-muted-foreground">{addressInfo.city}, {addressInfo.zip}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pickup Location</p>
                <p className="text-sm text-foreground">{storeInfo.address}</p>
                {storeInfo.estimatedPickup && <p className="text-sm text-warm-600 font-medium">Ready in {storeInfo.estimatedPickup}</p>}
              </>
            )}
          </div>
        )
      )}
    </div>
  )
}

export default Delivery
