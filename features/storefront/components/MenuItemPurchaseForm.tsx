"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus } from "lucide-react"
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
    <div className={cn("space-y-6 px-5 py-5 md:px-6", className)}>
      {modifierGroups.length > 0 && (
        <div className="space-y-6">
          {modifierGroups.map((group) => (
            <div key={group.id}>
              <div className="mb-3">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-foreground">
                  {group.name}
                </h3>
                <span className="mt-1.5 block text-sm text-muted-foreground">
                  {group.required ? "Required selection" : "Optional selection"}
                  {group.max > 1 && ` · choose up to ${group.max}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {group.modifiers.map((modifier) => {
                  const isSelected = isModifierSelected(group.id, modifier.id)

                  return (
                    <button
                      key={modifier.id}
                      type="button"
                      onClick={() => toggleModifier(group, modifier.id)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{modifier.name}</span>
                        {modifier.price > 0 && (
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isSelected ? "text-background/70" : "text-muted-foreground"
                            )}
                          >
                            +{formatCurrency(modifier.price, { currencyCode, locale })}
                          </span>
                        )}
                        {modifier.calories ? (
                          <span
                            className={cn(
                              "text-xs",
                              isSelected ? "text-background/70" : "text-muted-foreground"
                            )}
                          >
                            {modifier.calories} cal
                          </span>
                        ) : null}
                      </div>
                      {!group.required && (
                        <span
                          className={cn(
                            "ml-3 text-[11px] uppercase tracking-[0.22em]",
                            isSelected ? "text-background/70" : "text-muted-foreground"
                          )}
                        >
                          {isSelected ? "Selected" : "Pick"}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-foreground">
          Kitchen Notes
        </h3>
        <Textarea
          placeholder="Any allergies or special requests?"
          value={specialInstructions}
          onChange={(event) => setSpecialInstructions(event.target.value)}
          className="min-h-28 resize-none rounded-xl border-input bg-background text-base text-foreground placeholder:text-muted-foreground"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center rounded-xl border bg-background p-1">
          <div className="flex items-center">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-base font-medium text-foreground">{quantity}</span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Button
          className="h-12 flex-1 rounded-xl text-sm font-semibold"
          onClick={handleAddToCart}
          disabled={isAdding || item.available === false}
        >
          {item.available === false
            ? "Currently Unavailable"
            : isAdding
              ? "Adding..."
              : `Add to Cart — ${formatCurrency(itemTotal, { currencyCode, locale })}`}
        </Button>
      </div>
    </div>
  )
}
