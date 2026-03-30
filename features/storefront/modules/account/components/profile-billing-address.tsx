"use client"

import { useActionState, useEffect, useState } from "react"
import { upsertBillingAddress } from "@/features/storefront/lib/data/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Check } from "lucide-react"

export default function ProfileBillingAddress({ customer }: { customer: any }) {
  const [state, action, isPending] = useActionState(upsertBillingAddress, null)
  const [success, setSuccess] = useState(false)
  const billingAddress = customer?.billingAddress

  useEffect(() => {
    if (state?.success) {
      setSuccess(true)
      const timer = setTimeout(() => setSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <form action={action}>
      <div className="bg-card px-5 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              Billing Address
            </p>
            <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
              This is the one address marked as billing on your account. You can still manage all
              saved addresses separately, but only one stays assigned as your billing address.
            </p>

            <input type="hidden" name="id" value={billingAddress?.id || ""} />
            <input type="hidden" name="name" value="Billing Address" />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="billing-address1" className="text-xs text-muted-foreground">
                  Street address
                </Label>
                <Input
                  id="billing-address1"
                  name="address1"
                  defaultValue={billingAddress?.address1 || ""}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="billing-address2" className="text-xs text-muted-foreground">
                  Address 2
                </Label>
                <Input
                  id="billing-address2"
                  name="address2"
                  defaultValue={billingAddress?.address2 || ""}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-city" className="text-xs text-muted-foreground">
                  City
                </Label>
                <Input
                  id="billing-city"
                  name="city"
                  defaultValue={billingAddress?.city || ""}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-state" className="text-xs text-muted-foreground">
                  State / Province
                </Label>
                <Input
                  id="billing-state"
                  name="state"
                  defaultValue={billingAddress?.state || ""}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-postal" className="text-xs text-muted-foreground">
                  ZIP / Postal Code
                </Label>
                <Input
                  id="billing-postal"
                  name="postalCode"
                  defaultValue={billingAddress?.postalCode || ""}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing-country" className="text-xs text-muted-foreground">
                  Country Code
                </Label>
                <Input
                  id="billing-country"
                  name="countryCode"
                  defaultValue={billingAddress?.countryCode || billingAddress?.country || "US"}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="billing-phone" className="text-xs text-muted-foreground">
                  Phone
                </Label>
                <Input
                  id="billing-phone"
                  name="phone"
                  defaultValue={billingAddress?.phone || customer?.phone || ""}
                  className="h-9 max-w-sm"
                />
              </div>
            </div>

            {state?.error ? <p className="mt-2 text-xs text-destructive">{state.error}</p> : null}
          </div>

          <div className="shrink-0 pt-6">
            <Button type="submit" size="sm" variant="outline" disabled={isPending} className="h-9">
              {isPending ? (
                <Loader2 size={13} className="mr-1.5 animate-spin" />
              ) : success ? (
                <Check size={13} className="mr-1.5 text-emerald-600" />
              ) : null}
              {success ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
