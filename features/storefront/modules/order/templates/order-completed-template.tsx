import { OrderStatusTimeline, OrderStatus, OrderType } from "../components/order-status-timeline";
import { OrderItemsList } from "../components/order-items-list";
import { OrderSummary } from "../components/order-summary";
import { OrderDetailsCard } from "../components/order-details-card";
import { CheckCircle } from "lucide-react";

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
  deliveryCity?: string;
  deliveryZip?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: any[];
  payments?: any[];
}

interface OrderCompletedTemplateProps {
  order: RestaurantOrder;
}

export default function OrderCompletedTemplate({ order }: OrderCompletedTemplateProps) {
  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="mx-auto px-6 flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        <div
          className="flex flex-col gap-6 max-w-4xl h-full bg-background w-full py-10"
          data-testid="order-complete-container"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-semibold">Thank you!</h1>
            <p className="text-muted-foreground">
              Your order #{order.orderNumber} has been placed successfully.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <OrderStatusTimeline status={order.status} orderType={order.orderType} />
              <OrderDetailsCard
                orderNumber={order.orderNumber}
                orderType={order.orderType}
                createdAt={order.createdAt}
                customerName={order.customerName}
                customerEmail={order.customerEmail}
                customerPhone={order.customerPhone}
                deliveryAddress={order.deliveryAddress}
                deliveryCity={order.deliveryCity}
                deliveryZip={order.deliveryZip}
                specialInstructions={order.specialInstructions}
              />
            </div>

            <div className="space-y-6">
              <OrderItemsList items={order.orderItems} />
              <OrderSummary
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
    </div>
  );
}
