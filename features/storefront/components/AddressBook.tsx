"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, Trash2, Edit2, Loader2 } from "lucide-react"
import { deleteAddress } from "@/features/storefront/lib/data/user"
import { AddressModal } from "./AddressModal"
import { cn } from "@/lib/utils"

export function AddressBook({ addresses }: { addresses: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (address: any) => {
    setEditingAddress(address)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAddress(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      setDeletingId(id)
      await deleteAddress(id)
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-3xl">Saved Addresses</h2>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">You don't have any saved addresses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address: any) => (
            <Card key={address.id} className={cn("relative", address.isDefault && "border-primary")}>
              {address.isDefault && (
                <Badge className="absolute top-3 right-3" variant="secondary">Default</Badge>
              )}
              <CardHeader>
                <CardTitle className="text-base">{address.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p className="mt-2">{address.phone}</p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(address)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                >
                  {deletingId === address.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AddressModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        address={editingAddress}
        key={editingAddress?.id || 'new'} 
      />
    </>
  )
}
