import Contact from "@/features/storefront/modules/checkout/components/contact"
import Delivery from "@/features/storefront/modules/checkout/components/delivery"
import Payment from "@/features/storefront/modules/checkout/components/payment"
import Review from "@/features/storefront/modules/checkout/components/review"
import { listCartPaymentMethods } from "@/features/storefront/lib/data/payment"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"

interface CheckoutFormProps {
  cart: any;
  customer: any;
}

export default async function CheckoutForm({ cart, customer }: CheckoutFormProps) {
  if (!cart) {
    return null;
  }

  const [availablePaymentMethods, storeSettings] = await Promise.all([
    listCartPaymentMethods(),
    getStoreSettings(),
  ]);

  if (!availablePaymentMethods) {
    return null;
  }

  return (
    <div>
      <div className="w-full grid grid-cols-1 gap-y-2">
        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
          <Contact cart={cart} customer={customer} />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
          <Delivery cart={cart} customer={customer} storeSettings={storeSettings} />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
          <Payment cart={cart} availablePaymentMethods={availablePaymentMethods} />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8">
          <Review cart={cart} storeSettings={storeSettings} />
        </div>
      </div>
    </div>
  );
}
