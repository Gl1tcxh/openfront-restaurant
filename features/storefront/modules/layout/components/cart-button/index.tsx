import { fetchCart } from "@/features/storefront/lib/data"
import CartDropdown from "../cart-dropdown"

interface CartButtonProps {
  user?: any
  currencyCode: string
  locale: string
}

export default async function CartButton({ user, currencyCode, locale }: CartButtonProps) {
  const cart = await fetchCart()

  return (
    <CartDropdown
      cart={cart}
      currencyCode={currencyCode}
      locale={locale}
      user={user}
    />
  )
}
