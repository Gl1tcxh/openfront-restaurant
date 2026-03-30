"use client"

import { useState, useActionState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createAddress, updateAddress } from "@/features/storefront/lib/data/user"
import { Loader2 } from "lucide-react"

export function AddressModal({ isOpen, onClose, address }: { isOpen: boolean, onClose: () => void, address?: any }) {
  const [state, action, isPending] = useActionState(address ? updateAddress : createAddress, null)
  
  // Close modal on success
  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="grid gap-4 py-4">
          {address && <input type="hidden" name="id" value={address.id} />}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" name="name" defaultValue={address?.name} placeholder="Home, Work..." className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address1" className="text-right">Address</Label>
            <Input id="address1" name="address1" defaultValue={address?.address1} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address2" className="text-right">Apt/Suite</Label>
            <Input id="address2" name="address2" defaultValue={address?.address2} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">City</Label>
            <Input id="city" name="city" defaultValue={address?.city} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="state" className="text-right">State</Label>
            <Input id="state" name="state" defaultValue={address?.state} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postalCode" className="text-right">ZIP / Postal</Label>
            <Input id="postalCode" name="postalCode" defaultValue={address?.postalCode} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="countryCode" className="text-right">Country Code</Label>
            <Input
              id="countryCode"
              name="countryCode"
              defaultValue={address?.countryCode || address?.country || "US"}
              placeholder="US"
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" name="phone" defaultValue={address?.phone} className="col-span-3" />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
             <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox id="isDefault" name="isDefault" defaultChecked={address?.isDefault} />
                <label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Set as default address
                </label>
             </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <div className="col-start-2 col-span-3 flex items-center space-x-2">
                <Checkbox id="isBilling" name="isBilling" defaultChecked={address?.isBilling} />
                <label htmlFor="isBilling" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Use as billing address
                </label>
             </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
