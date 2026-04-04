import Contact from "@/features/storefront/modules/checkout/components/contact"
import Delivery from "@/features/storefront/modules/checkout/components/delivery"
import Payment from "@/features/storefront/modules/checkout/components/payment"
import { listCartPaymentMethods } from "@/features/storefront/lib/data/payment"

interface CheckoutFormProps {
  cart: any
  customer: any
  storeSettings: any
}

export default async function CheckoutForm({
  cart,
  customer,
  storeSettings,
}: CheckoutFormProps) {
  if (!cart) {
    return null
  }

  const availablePaymentMethods = await listCartPaymentMethods()

  if (!availablePaymentMethods) {
    return null
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-y-4">
        <div className="storefront-surface bg-card p-6 sm:p-7 md:p-8">
          <Contact cart={cart} customer={customer} storeSettings={storeSettings} />
        </div>

        <div className="storefront-surface bg-card p-6 sm:p-7 md:p-8">
          <Delivery cart={cart} customer={customer} storeSettings={storeSettings} />
        </div>

        <div className="storefront-surface bg-card p-6 sm:p-7 md:p-8">
          <Payment
            cart={cart}
            availablePaymentMethods={availablePaymentMethods}
            storeSettings={storeSettings}
          />
        </div>
      </div>
    </div>
  )
}
