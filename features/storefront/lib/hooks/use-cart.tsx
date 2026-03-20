"use client"

import { useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchCart } from "../data"
import {
  createCart,
  addToCart,
  removeCartItem,
  updateCartItemQuantity
} from "../data/cart-client"
import { queryKeys } from "../query-keys"
import type { CartItem, MenuItem, SelectedModifier } from "../store-data"

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
    queryKey: queryKeys.cart.active(),
    queryFn: () => fetchCart(),
    staleTime: 5000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
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
  const cartId = getCartId() || null

  return {
    ...query,
    items,
    subtotal,
    itemCount,
    cartId,
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

      // If no cart ID, create a new cart
      if (!cartId) {
        const newCart = await createCart(params.orderType || "pickup")
        cartId = newCart.id
        setCartIdCookie(cartId)
      }

      // Try to add to cart. If cart doesn't exist (DB reset, expired, etc.),
      // clear cookie, create new cart, and retry (like OpenFront's getOrSetCart)
      try {
        return await addToCart({
          cartId,
          menuItemId: params.menuItem.id,
          quantity: params.quantity,
          modifierIds: params.modifiers.map((m) => m.modifierId),
          specialInstructions: params.specialInstructions,
        })
      } catch (error: any) {
        // If cart doesn't exist or access denied, create new cart and retry
        const errorMessage = error?.message || String(error)
        if (errorMessage.includes("Access denied") || errorMessage.includes("not exist") || errorMessage.includes("Cart not found")) {
          // Clear stale cookie and create new cart
          removeCartIdCookie()
          const newCart = await createCart(params.orderType || "pickup")
          cartId = newCart.id
          setCartIdCookie(cartId)

          // Retry with new cart
          return addToCart({
            cartId,
            menuItemId: params.menuItem.id,
            quantity: params.quantity,
            modifierIds: params.modifiers.map((m) => m.modifierId),
            specialInstructions: params.specialInstructions,
          })
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.active() })
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      try {
        return await removeCartItem(cartItemId)
      } catch (error: any) {
        // If cart doesn't exist, clear cookie and return silently
        const errorMessage = error?.message || String(error)
        if (errorMessage.includes("Access denied") || errorMessage.includes("not exist")) {
          removeCartIdCookie()
          queryClient.removeQueries({ queryKey: queryKeys.cart.active() })
          return null
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.active() })
    },
  })
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { cartItemId: string; quantity: number }) => {
      try {
        return await updateCartItemQuantity(params)
      } catch (error: any) {
        // If cart doesn't exist, clear cookie and return silently
        const errorMessage = error?.message || String(error)
        if (errorMessage.includes("Access denied") || errorMessage.includes("not exist")) {
          removeCartIdCookie()
          queryClient.removeQueries({ queryKey: queryKeys.cart.active() })
          return null
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.active() })
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    removeCartIdCookie()
    queryClient.removeQueries({ queryKey: queryKeys.cart.active() })
  }, [queryClient])
}
