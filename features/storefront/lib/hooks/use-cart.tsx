"use client"

import { useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchCart, createCart, addToCart, removeCartItem, updateCartItemQuantity } from "../data/cart-client"
import type { CartItem, MenuItem, SelectedModifier } from "../store-data"

const CART_QUERY_KEY = ["cart"] as const
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

export function useCartData() {
  const query = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => fetchCart(),
    staleTime: 5000,
  })

  const items: CartItem[] = useMemo(
    () =>
      (query.data?.items || []).map((item: any) => ({
        id: item.id,
        menuItem: item.menuItem,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        modifiers: (item.modifiers || []).map((m: any) => ({
          modifierId: m.id,
          name: m.name,
          price: m.priceAdjustment,
        })),
      })),
    [query.data],
  )

  const subtotal = query.data?.subtotal || 0
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  return {
    ...query,
    items,
    subtotal,
    itemCount,
  }
}

export function useAddItemToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      menuItem: MenuItem
      quantity: number
      modifiers: SelectedModifier[]
      specialInstructions?: string
      orderType?: string
    }) => {
      const existingCartId = getCartId()
      let cartId = existingCartId || ""

      if (!cartId) {
        const newCart = await createCart(params.orderType || "pickup")
        cartId = newCart.id
        setCartIdCookie(cartId)
      }

      return addToCart({
        cartId,
        menuItemId: params.menuItem.id,
        quantity: params.quantity,
        modifierIds: params.modifiers.map((m) => m.modifierId),
        specialInstructions: params.specialInstructions,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cartItemId: string) => removeCartItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    },
  })
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { cartItemId: string; quantity: number }) => updateCartItemQuantity(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    removeCartIdCookie()
    queryClient.removeQueries({ queryKey: CART_QUERY_KEY })
  }, [queryClient])
}
