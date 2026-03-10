"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
      {/* Toolbar */}
      <div className="flex items-center justify-end mb-4">
        <Button size="sm" onClick={handleCreate} variant="outline" className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
          <button
            onClick={handleCreate}
            className="inline-block mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((address: any) => (
            <div
              key={address.id}
              className={cn(
                "rounded-lg border bg-card p-4 relative",
                address.isDefault
                  ? "border-foreground/30"
                  : "border-border"
              )}
            >
              {address.isDefault && (
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  Default
                </span>
              )}

              <div className="flex items-start gap-2 mb-3">
                <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{address.name}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5 pl-5">
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                  {address.city}
                  {address.state ? `, ${address.state}` : ""} {address.postalCode}
                </p>
                {address.phone && <p className="pt-1">{address.phone}</p>}
              </div>

              <div className="flex items-center gap-1 pt-3 mt-3 border-t border-border">
                <button
                  onClick={() => handleEdit(address)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded hover:bg-muted"
                >
                  <Edit2 size={11} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deletingId === address.id}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors py-1 px-2 rounded hover:bg-destructive/5 ml-auto"
                >
                  {deletingId === address.id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Trash2 size={11} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={editingAddress}
        key={editingAddress?.id || "new"}
      />
    </>
  )
}
