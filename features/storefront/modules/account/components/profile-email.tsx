"use client"

import { useActionState, useEffect, useState } from "react"
import { updateCustomerEmail } from "@/features/storefront/lib/data/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Check } from "lucide-react"

export default function ProfileEmail({ customer }: { customer: any }) {
  const [state, action, isPending] = useActionState(updateCustomerEmail, null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (state?.success) {
      setSuccess(true)
      const timer = setTimeout(() => setSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <form action={action}>
      <div className="px-5 py-5 bg-card">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Email Address</p>
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer.email}
                required
                className="h-9"
              />
            </div>
            {state?.error && (
              <p className="text-xs text-destructive mt-2">{state.error}</p>
            )}
          </div>
          <div className="pt-6 shrink-0">
            <Button type="submit" size="sm" variant="outline" disabled={isPending} className="h-9">
              {isPending ? (
                <Loader2 size={13} className="animate-spin mr-1.5" />
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
