import { retrieveCart } from "@/features/storefront/lib/data/cart"
import CartDropdown from "../cart-dropdown"

interface CartButtonProps {
  currencyCode: string
  locale: string
}

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  return cart
}

export default async function CartButton({ currencyCode, locale }: CartButtonProps) {
  const cart = await fetchCart()

  return (
    <CartDropdown
      cart={cart}
      currencyCode={currencyCode}
      locale={locale}
    />
  )
}
