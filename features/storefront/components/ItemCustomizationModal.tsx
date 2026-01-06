"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { X, Minus, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useCart } from "@/features/storefront/lib/cart-context"
import type { MenuItem, SelectedModifier, MenuItemModifier } from "@/features/storefront/lib/store-data"

interface ItemCustomizationModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
}

// Helper to get image URL
function getImageUrl(image: any): string {
  if (typeof image === 'string') return image
  if (image?.url) return image.url
  return '/placeholder.jpg'
}

// Helper to get description text
function getDescriptionText(description: any): string {
  if (typeof description === 'string') return description
  if (typeof description === 'object' && description?.document) {
    const extractText = (node: any): string => {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (Array.isArray(node)) return node.map(extractText).join(' ')
      if (node.children) return extractText(node.children)
      if (node.text) return node.text
      if (node.leaves) return node.leaves.map(extractText).join(' ')
      return ''
    }
    return extractText(description.document)
  }
  return ''
}

export function ItemCustomizationModal({ item, isOpen, onClose }: ItemCustomizationModalProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")

  // Group modifiers by modifierGroup
  const modifierGroups = useMemo(() => {
    if (!item?.modifiers || item.modifiers.length === 0) return []

    const groups: Record<string, MenuItemModifier[]> = {}
    item.modifiers.forEach((mod) => {
      const groupKey = mod.modifierGroup || 'other'
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(mod)
    })

    // Convert to array and add defaults for missing properties
    return Object.entries(groups).map(([groupName, modifiers]) => {
      const firstMod = modifiers[0]
      return {
        id: groupName,
        name: firstMod.modifierGroupLabel || groupName.charAt(0).toUpperCase() + groupName.slice(1),
        required: firstMod.required || false,
        min: firstMod.minSelections || 0,
        max: firstMod.maxSelections || modifiers.length,
        modifiers: modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          price: Number(m.priceAdjustment),
          calories: m.calories,
          default: m.defaultSelected || false,
        }))
      }
    })
  }, [item?.modifiers])

  useEffect(() => {
    if (item) {
      setQuantity(1)
      setSpecialInstructions("")
      const defaults: SelectedModifier[] = []
      modifierGroups.forEach((group) => {
        group.modifiers.forEach((modifier) => {
          if (modifier.default) {
            defaults.push({
              groupId: group.id,
              modifierId: modifier.id,
              name: modifier.name,
              price: modifier.price,
            })
          }
        })
      })
      setSelectedModifiers(defaults)
    }
  }, [item, modifierGroups])

  if (!item) return null

  const toggleModifier = (group: any, modifierId: string) => {
    const modifier = group.modifiers.find((m: any) => m.id === modifierId)
    if (!modifier) return

    const existingIndex = selectedModifiers.findIndex((m) => m.groupId === group.id && m.modifierId === modifierId)

    if (existingIndex >= 0) {
      if (group.required && selectedModifiers.filter((m) => m.groupId === group.id).length <= group.min) {
        return
      }
      setSelectedModifiers((prev) => prev.filter((_, i) => i !== existingIndex))
    } else {
      const currentGroupCount = selectedModifiers.filter((m) => m.groupId === group.id).length
      if (currentGroupCount >= group.max) {
        if (group.max === 1) {
          setSelectedModifiers((prev) => [
            ...prev.filter((m) => m.groupId !== group.id),
            {
              groupId: group.id,
              modifierId: modifier.id,
              name: modifier.name,
              price: modifier.price,
            },
          ])
        }
        return
      }
      setSelectedModifiers((prev) => [
        ...prev,
        {
          groupId: group.id,
          modifierId: modifier.id,
          name: modifier.name,
          price: modifier.price,
        },
      ])
    }
  }

  const isModifierSelected = (groupId: string, modifierId: string) => {
    return selectedModifiers.some((m) => m.groupId === groupId && m.modifierId === modifierId)
  }

  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0)
  const itemTotal = (Number(item.price) + modifiersTotal) * quantity

  const handleAddToCart = () => {
    addItem(item, quantity, selectedModifiers, specialInstructions || undefined)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-background">
        {/* Image */}
        <div className="relative h-56 sm:h-72 bg-muted">
          <Image src={getImageUrl(item.image)} alt={item.name} fill className="object-cover" />
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-18rem)]">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <h2 className="font-serif text-2xl md:text-3xl mb-2">{item.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{getDescriptionText(item.description)}</p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="font-medium">${Number(item.price).toFixed(2)}</span>
              {item.calories && <span className="text-muted-foreground">{item.calories} cal</span>}
            </div>
          </div>

          {/* Modifiers */}
          {modifierGroups.length > 0 && (
            <div className="px-6 py-6 space-y-8">
              {modifierGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="font-medium">{group.name}</h3>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {group.required ? "Required" : "Optional"}
                      {group.max > 1 && ` · Up to ${group.max}`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.modifiers.map((modifier) => {
                      const isSelected = isModifierSelected(group.id, modifier.id)
                      return (
                        <button
                          key={modifier.id}
                          onClick={() => toggleModifier(group, modifier.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 border transition-all text-left",
                            isSelected ? "border-foreground bg-muted/50" : "border-border hover:border-muted-foreground",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-5 w-5 border flex items-center justify-center transition-colors",
                                isSelected ? "border-foreground bg-foreground" : "border-muted-foreground",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-background" />}
                            </div>
                            <div>
                              <p className="text-sm">{modifier.name}</p>
                              {modifier.calories && (
                                <p className="text-xs text-muted-foreground">{modifier.calories} cal</p>
                              )}
                            </div>
                          </div>
                          {modifier.price > 0 && <span className="text-sm">+${modifier.price.toFixed(2)}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div className="px-6 py-6 border-t border-border">
            <h3 className="font-medium mb-4">Special Instructions</h3>
            <Textarea
              placeholder="Any allergies or special requests?"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="resize-none border-border"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center border border-border bg-background">
              <button
                className="h-12 w-12 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg w-12 text-center">{quantity}</span>
              <button
                className="h-12 w-12 flex items-center justify-center hover:bg-muted transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-xs"
              onClick={handleAddToCart}
            >
              Add to Bag · ${itemTotal.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
