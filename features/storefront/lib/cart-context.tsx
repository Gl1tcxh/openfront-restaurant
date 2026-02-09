"use client"

import { createContext, useContext, useState, type ReactNode, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchCart } from "./data"
import { createCart, addToCart, removeCartItem, updateCartItemQuantity } from "./data/cart-client"
import type { CartItem, MenuItem, SelectedModifier } from "./store-data"

interface CartContextType {
  items: CartItem[]
  addItem: (menuItem: MenuItem, quantity: number, modifiers: SelectedModifier[], specialInstructions?: string) => Promise<void>
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_ID_COOKIE = "_restaurant_cart_id"

const getCartId = () => {
  if (typeof window === "undefined") return null
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CART_ID_COOKIE}=`))
    ?.split("=")[1]
}

const setCartIdCookie = (id: string) => {
  if (typeof window === "undefined") return
  document.cookie = `${CART_ID_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
}

const removeCartIdCookie = () => {
  if (typeof window === "undefined") return
  document.cookie = `${CART_ID_COOKIE}=; path=/; max-age=-1`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCart(),
    staleTime: 5000,
  })

  // Sync server items to CartItem format for existing components
  const items: CartItem[] = (cart?.items || []).map((item: any) => ({
    id: item.id,
    menuItem: item.menuItem,
    quantity: item.quantity,
    specialInstructions: item.specialInstructions,
    modifiers: (item.modifiers || []).map((m: any) => ({
      modifierId: m.id,
      name: m.name,
      price: m.priceAdjustment,
    })),
  }))

  const addItemMutation = useMutation({
    mutationFn: async (params: { menuItemId: string; quantity: number; modifierIds: string[]; specialInstructions?: string }) => {
      let currentCartId = getCartId()
      if (!currentCartId) {
        const newCart = await createCart()
        currentCartId = newCart.id
        setCartIdCookie(currentCartId)
      }
      return addToCart({ ...params, cartId: currentCartId! })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      setIsCartOpen(true)
    },
  })

  const addItem = useCallback(
    async (menuItem: MenuItem, quantity: number, modifiers: SelectedModifier[], specialInstructions?: string) => {
      await addItemMutation.mutateAsync({
        menuItemId: menuItem.id,
        quantity,
        modifierIds: modifiers.map((m) => m.modifierId),
        specialInstructions,
      })
    },
    [addItemMutation],
  )

  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      return removeCartItem(cartItemId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })

  const updateQuantityMutation = useMutation({
    mutationFn: async (params: { cartItemId: string; quantity: number }) => {
      return updateCartItemQuantity(params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })

  const removeItem = useCallback(
    (cartItemId: string) => {
      removeItemMutation.mutate(cartItemId)
    },
    [removeItemMutation],
  )

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      updateQuantityMutation.mutate({ cartItemId, quantity })
    },
    [updateQuantityMutation],
  )

  const clearCart = useCallback(() => {
    removeCartIdCookie()
    queryClient.removeQueries({ queryKey: ["cart"] })
    setIsCartOpen(false)
  }, [queryClient])

  const subtotal = cart?.subtotal || 0
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
