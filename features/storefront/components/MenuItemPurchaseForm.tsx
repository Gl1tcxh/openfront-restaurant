"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { addToCart } from "@/features/storefront/lib/data/cart"
import type { MenuItem, MenuItemModifier, SelectedModifier } from "@/features/storefront/lib/store-data"

interface MenuItemPurchaseFormProps {
  item: MenuItem
  currencyCode?: string
  locale?: string
  orderType?: "pickup" | "delivery"
  onAdded?: () => void
  className?: string
}

export function MenuItemPurchaseForm({
  item,
  currencyCode = "USD",
  locale = "en-US",
  orderType = "pickup",
  onAdded,
  className,
}: MenuItemPurchaseFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const modifierGroups = useMemo(() => {
    if (!item.modifiers || item.modifiers.length === 0) return []

    const groups: Record<string, MenuItemModifier[]> = {}
    item.modifiers.forEach((modifier) => {
      const groupKey = modifier.modifierGroup || "other"
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(modifier)
    })

    return Object.entries(groups).map(([groupName, modifiers]) => {
      const firstModifier = modifiers[0]
      return {
        id: groupName,
        name:
          firstModifier.modifierGroupLabel ||
          groupName.charAt(0).toUpperCase() + groupName.slice(1),
        required: firstModifier.required || false,
        min: firstModifier.minSelections || 0,
        max: firstModifier.maxSelections || modifiers.length,
        modifiers: modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          price: Number(modifier.priceAdjustment),
          calories: modifier.calories,
          default: modifier.defaultSelected || false,
        })),
      }
    })
  }, [item.modifiers])

  useEffect(() => {
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
  }, [item.id, modifierGroups])

  const toggleModifier = (group: (typeof modifierGroups)[number], modifierId: string) => {
    const modifier = group.modifiers.find((entry) => entry.id === modifierId)
    if (!modifier) return

    const existingIndex = selectedModifiers.findIndex(
      (entry) => entry.groupId === group.id && entry.modifierId === modifierId
    )

    if (existingIndex >= 0) {
      if (
        group.required &&
        selectedModifiers.filter((entry) => entry.groupId === group.id).length <= group.min
      ) {
        return
      }
      setSelectedModifiers((previous) => previous.filter((_, index) => index !== existingIndex))
      return
    }

    const currentGroupCount = selectedModifiers.filter((entry) => entry.groupId === group.id).length
    if (currentGroupCount >= group.max) {
      if (group.max === 1) {
        setSelectedModifiers((previous) => [
          ...previous.filter((entry) => entry.groupId !== group.id),
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

    setSelectedModifiers((previous) => [
      ...previous,
      {
        groupId: group.id,
        modifierId: modifier.id,
        name: modifier.name,
        price: modifier.price,
      },
    ])
  }

  const isModifierSelected = (groupId: string, modifierId: string) => {
    return selectedModifiers.some(
      (entry) => entry.groupId === groupId && entry.modifierId === modifierId
    )
  }

  const modifiersTotal = selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0)
  const itemTotal = (Number(item.price) + modifiersTotal) * quantity

  const handleAddToCart = async () => {
    if (item.available === false) return

    setIsAdding(true)

    try {
      await addToCart({
        menuItemId: item.id,
        quantity,
        modifierIds: selectedModifiers.map((modifier) => modifier.modifierId),
        specialInstructions: specialInstructions || undefined,
        orderType,
      })

      onAdded?.()
    } catch (error) {
      console.error("Error adding to cart:", error)
    }

    setIsAdding(false)
  }

  return (
    <div className={cn("space-y-5 px-5 py-5 md:px-6", className)}>
      {modifierGroups.length > 0 && (
        <div className="space-y-5">
          {modifierGroups.map((group) => (
            <div key={group.id}>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.name}
                  </h3>
                  {group.required && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-warm-100 text-warm-700 rounded-full px-2 py-0.5">
                      Required
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-muted-foreground">
                  {group.required ? "Select one" : "Optional"}
                  {group.max > 1 && ` · up to ${group.max}`}
                </span>
              </div>
              <div className="space-y-2">
                {group.modifiers.map((modifier) => {
                  const isSelected = isModifierSelected(group.id, modifier.id)

                  return (
                    <button
                      key={modifier.id}
                      type="button"
                      onClick={() => toggleModifier(group, modifier.id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:border-warm-200 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-primary-foreground"
                              : "border-border"
                          )}>
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{modifier.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {modifier.calories ? (
                            <span className={cn(
                              "text-xs",
                              isSelected ? "text-primary-foreground/60" : "text-muted-foreground"
                            )}>
                              {modifier.calories} cal
                            </span>
                          ) : null}
                          {modifier.price > 0 && (
                            <span className={cn(
                              "text-xs font-semibold",
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              +{formatCurrency(modifier.price, { currencyCode, locale })}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kitchen Notes */}
      <div className="rounded-xl bg-muted/50 p-4 border border-border/40">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Special Instructions
        </h3>
        <Textarea
          placeholder="Any allergies or special requests?"
          value={specialInstructions}
          onChange={(event) => setSpecialInstructions(event.target.value)}
          className="min-h-24 resize-none rounded-lg border-border/60 bg-background text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-warm-500/30"
          rows={3}
        />
      </div>

      {/* Quantity + Add to Cart */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
        <div className="flex items-center rounded-xl border border-border bg-background">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-l-xl text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-11 text-center text-base font-semibold text-foreground tabular-nums">{quantity}</span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-muted"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button
          className="h-12 flex-1 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 shadow-sm gap-2"
          onClick={handleAddToCart}
          disabled={isAdding || item.available === false}
        >
          <ShoppingBag className="h-4 w-4" />
          {item.available === false
            ? "Currently Unavailable"
            : isAdding
              ? "Adding..."
              : `Add to Order — ${formatCurrency(itemTotal, { currencyCode, locale })}`}
        </Button>
      </div>
    </div>
  )
}
