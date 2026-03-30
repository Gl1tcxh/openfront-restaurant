import {
  OrderStatusTimeline,
  OrderStatus,
  OrderType,
} from "../components/order-status-timeline";
import { OrderItemsList } from "../components/order-items-list";
import { OrderSummary } from "../components/order-summary";
import { OrderDetailsCard } from "../components/order-details-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RestaurantOrder {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  orderSource: string;
  status: OrderStatus;
  guestCount?: number;
  specialInstructions?: string;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  total: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryAddress2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountryCode?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: any[];
  payments?: any[];
}

interface OrderDetailsTemplateProps {
  order: RestaurantOrder;
}

export default function OrderDetailsTemplate({
  order,
}: OrderDetailsTemplateProps) {
  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="mx-auto px-6 flex flex-col gap-y-6 max-w-4xl w-full">
        <div className="flex flex-col justify-between gap-3">
          <Link
            href="/account"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mt-px" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-semibold">Order #{order.orderNumber}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/order/confirmed/${order.id}`}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            View confirmation
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <OrderStatusTimeline
              status={order.status}
              orderType={order.orderType}
            />
            <OrderDetailsCard
              orderNumber={order.orderNumber}
              orderType={order.orderType}
              createdAt={order.createdAt}
              customerName={order.customerName}
              customerEmail={order.customerEmail}
              customerPhone={order.customerPhone}
              deliveryAddress={order.deliveryAddress}
              deliveryAddress2={order.deliveryAddress2}
              deliveryCity={order.deliveryCity}
              deliveryState={order.deliveryState}
              deliveryZip={order.deliveryZip}
              deliveryCountryCode={order.deliveryCountryCode}
              specialInstructions={order.specialInstructions}
            />
          </div>

          <div className="space-y-6">
            <OrderItemsList items={order.orderItems} />
            <OrderSummary
              orderType={order.orderType}
              subtotal={order.subtotal}
              tax={order.tax}
              tip={order.tip}
              discount={order.discount}
              total={order.total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
