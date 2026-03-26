"use client"

import { CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Divider from "@/features/storefront/modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { createGuestUser } from "@/features/storefront/lib/data/user"
import { setCheckoutContact } from "@/features/storefront/lib/data/cart"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const Contact = ({
  cart,
  customer,
}: {
  cart: any
  customer: any
}) => {
  const user = customer
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams?.get("step") === "contact"

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderType, setOrderType] = useState(cart?.orderType || "pickup")
  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.name?.split(" ")[0] || cart?.customerName?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || cart?.customerName?.split(" ").slice(1).join(" ") || "",
    email: user?.email || cart?.email || "",
    phone: user?.phone || cart?.customerPhone || "",
  })

  const isComplete = customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone

  const handleEdit = () => {
    router.push(pathname + "?step=contact")
  }

  const handleSubmit = async () => {
    if (!isComplete) return
    setIsLoading(true)
    setError(null)

    try {
      let customerId = user?.id

      // Create guest user if not logged in
      if (!user) {
        const result = await createGuestUser({
          email: customerInfo.email,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          phone: customerInfo.phone,
        })
        if (!result.success) {
          setError(result.error || "Could not proceed. Please try again.")
          setIsLoading(false)
          return
        }
        customerId = result.userId
      }

      // Save to cart
      const result = await setCheckoutContact({
        email: customerInfo.email,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerPhone: customerInfo.phone,
        orderType,
        userId: customerId,
      })

      if (!result.success) {
        setError(result.message || "Could not proceed. Please try again.")
        setIsLoading(false)
        return
      }

      router.push(pathname + "?step=delivery")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background">
      <div className="flex flex-row items-center justify-between mb-6">
        <h2 className="flex flex-row text-3xl font-medium gap-x-2 items-baseline">
          Contact
          {!isOpen && isComplete && <CircleCheck className="hidden sm:block h-5 w-5" />}
        </h2>
        {!isOpen && isComplete && (
          <Button onClick={handleEdit} data-testid="edit-contact-button" variant="outline" size="sm">
            Update Contact
          </Button>
        )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium uppercase tracking-wide">Order Type</Label>
            <RadioGroup value={orderType} onValueChange={(val) => setOrderType(val)} className="grid grid-cols-2 gap-3">
              <div>
                <RadioGroupItem value="pickup" id="order-pickup" className="peer sr-only" />
                <Label htmlFor="order-pickup" className="flex items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center transition-colors rounded-md">
                  <span className="text-sm font-medium">Pickup</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="delivery" id="order-delivery" className="peer sr-only" />
                <Label htmlFor="order-delivery" className="flex items-center justify-center border border-border p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center transition-colors rounded-md">
                  <span className="text-sm font-medium">Delivery</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide">Your Information</h3>
            {!user && (
              <p className="text-xs text-muted-foreground">
                Already have an account? <Link href="/account" className="text-primary hover:underline">Sign in</Link>
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First name" value={customerInfo.firstName} onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))} required data-testid="first-name-input" />
              <Input placeholder="Last name" value={customerInfo.lastName} onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))} required data-testid="last-name-input" />
            </div>
            <Input type="email" placeholder="Email" value={customerInfo.email} onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))} required data-testid="email-input" />
            <Input type="tel" placeholder="Phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))} required data-testid="phone-input" />
          </div>

          {error && (
            <div className="pt-2 text-rose-500 text-xs leading-5 font-normal">
              <span>{error}</span>
            </div>
          )}

          <Button size="lg" onClick={handleSubmit} disabled={!isComplete || isLoading} data-testid="submit-contact-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue to Next Step
          </Button>
        </div>
      ) : (
        isComplete && (
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-x-8">
            <div className="flex flex-col w-full sm:w-1/3" data-testid="contact-summary">
              <p className="text-sm font-medium text-foreground mb-1">Contact</p>
              <p className="text-sm font-normal text-muted-foreground">{customerInfo.firstName} {customerInfo.lastName}</p>
              <p className="text-sm font-normal text-muted-foreground">{customerInfo.email}</p>
              <p className="text-sm font-normal text-muted-foreground">{customerInfo.phone}</p>
            </div>
            <div className="flex flex-col w-full sm:w-1/3" data-testid="order-type-summary">
              <p className="text-sm font-medium text-foreground mb-1">Order Type</p>
              <p className="text-sm font-normal text-muted-foreground capitalize">{orderType}</p>
            </div>
          </div>
        )
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Contact
