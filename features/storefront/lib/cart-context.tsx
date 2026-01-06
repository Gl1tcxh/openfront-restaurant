"use client"

import { createContext, useContext, useState, type ReactNode, useCallback } from "react"
import type { CartItem, MenuItem, SelectedModifier } from "./store-data"

interface CartContextType {
  items: CartItem[]
  addItem: (menuItem: MenuItem, quantity: number, modifiers: SelectedModifier[], specialInstructions?: string) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addItem = useCallback(
    (menuItem: MenuItem, quantity: number, modifiers: SelectedModifier[], specialInstructions?: string) => {
      const cartItem: CartItem = {
        id: `${menuItem.id}-${Date.now()}`,
        menuItem,
        quantity,
        modifiers,
        specialInstructions,
      }
      setItems((prev) => [...prev, cartItem])
      setIsCartOpen(true)
    },
    [],
  )

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId))
  }, [])

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId)
        return
      }
      setItems((prev) => prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item)))
    },
    [removeItem],
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const subtotal = items.reduce((total, item) => {
    const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.price, 0)
    return total + (Number(item.menuItem.price) + modifiersTotal) * item.quantity
  }, 0)

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
