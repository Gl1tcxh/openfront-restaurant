"use client"

import { useActionState, useEffect, useState } from "react"
import { updateCustomerName } from "@/features/storefront/lib/data/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, Check } from "lucide-react"

export default function ProfileName({ customer }: { customer: any }) {
  const [state, action, isPending] = useActionState(updateCustomerName, null)
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
          <CardTitle>Display Name</CardTitle>
          <CardDescription>Update your first and last name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                defaultValue={customer.firstName || customer.name?.split(' ')[0]} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                defaultValue={customer.lastName || customer.name?.split(' ').slice(1).join(' ')} 
                required 
              />
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between items-center py-3">
          <p className="text-xs text-muted-foreground">Please use your real name for order pickup.</p>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : success ? <Check size={14} className="mr-2" /> : null}
            {success ? "Saved" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
