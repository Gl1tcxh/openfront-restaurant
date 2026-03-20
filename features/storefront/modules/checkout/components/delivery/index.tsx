"use client"

import { CircleCheck, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Divider from "@/features/storefront/modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const UPDATE_CART = `
  mutation UpdateCart($cartId: ID!, $data: CartUpdateInput!) {
    updateActiveCart(cartId: $cartId, data: $data) { id }
  }
`

async function graphqlRequest(query: string, variables: any) {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  })
  const result = await response.json()
  if (result.errors?.length) {
    throw new Error(result.errors[0]?.message || "GraphQL error")
  }
  return result.data
}

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
      await graphqlRequest(UPDATE_CART, {
        cartId: cart.id,
        data: {
          deliveryAddress: addressInfo.address,
          deliveryCity: addressInfo.city,
          deliveryZip: addressInfo.zip,
        },
      })

      router.push(pathname + "?step=payment")
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className={cn("flex flex-row text-3xl font-medium gap-x-2 items-baseline", { "opacity-50 pointer-events-none select-none": !isOpen && !isComplete })}>
          {orderType === "delivery" ? "Delivery Address" : "Pickup Location"}
          {!isOpen && isComplete && <CircleCheck className="hidden sm:block h-5 w-5" />}
        </h2>
        {!isOpen && isComplete && (
          <Button onClick={handleEdit} data-testid="edit-delivery-button" variant="outline" size="sm">
            Update
          </Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          {orderType === "delivery" ? (
            <div className="space-y-4">
              {user && user.addresses?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Use a saved address:</p>
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
                          "text-left p-3 border rounded-md text-sm transition-colors hover:bg-muted",
                          addressInfo.address === address.address1 ? "border-primary bg-muted/50" : "border-border"
                        )}
                      >
                        <p className="font-medium">{address.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{address.address1}, {address.city}</p>
                      </button>
                    ))}
                  </div>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><Separator /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="address" className="text-xs text-muted-foreground">Street Address</Label>
                <Input id="address" placeholder="123 Main St" className="mt-1" value={addressInfo.address} onChange={(e) => setAddressInfo(prev => ({ ...prev, address: e.target.value }))} data-testid="address-input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                  <Input id="city" placeholder="Brooklyn" className="mt-1" value={addressInfo.city} onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))} data-testid="city-input" />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-xs text-muted-foreground">ZIP Code</Label>
                  <Input id="zip" placeholder="11201" className="mt-1" value={addressInfo.zip} onChange={(e) => setAddressInfo(prev => ({ ...prev, zip: e.target.value }))} data-testid="zip-input" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" /> Pickup Location
              </h3>
              <p className="text-sm">{storeInfo.address}</p>
              <p className="text-sm text-muted-foreground mt-1">Ready in {storeInfo.estimatedPickup}</p>
            </div>
          )}
          <Button size="lg" onClick={handleSubmit} disabled={!isComplete || isLoading} data-testid="submit-delivery-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Payment
          </Button>
        </div>
      ) : (
        isComplete && (
          <div className="flex flex-col w-full sm:w-1/3" data-testid="delivery-summary">
            {orderType === "delivery" ? (
              <>
                <p className="text-sm font-medium text-foreground mb-1">Delivery Address</p>
                <p className="text-sm font-normal text-muted-foreground">{addressInfo.address}</p>
                <p className="text-sm font-normal text-muted-foreground">{addressInfo.city}, {addressInfo.zip}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground mb-1">Pickup Location</p>
                <p className="text-sm font-normal text-muted-foreground">{storeInfo.address}</p>
                <p className="text-sm font-normal text-muted-foreground">Ready in {storeInfo.estimatedPickup}</p>
              </>
            )}
          </div>
        )
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Delivery
