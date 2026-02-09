"use client"

import { useActionState, useEffect, useState } from "react"
import { updateCustomerPhone } from "@/features/storefront/lib/data/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, Check } from "lucide-react"

export default function ProfilePhone({ customer }: { customer: any }) {
  const [state, action, isPending] = useActionState(updateCustomerPhone, null)
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
      <Card>
        <CardHeader>
          <CardTitle>Phone Number</CardTitle>
          <CardDescription>Add a phone number for delivery contact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={customer.phone} placeholder="(555) 000-0000" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between items-center py-3">
          <p className="text-xs text-muted-foreground">Used by drivers to contact you for delivery.</p>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : success ? <Check size={14} className="mr-2" /> : null}
            {success ? "Saved" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
