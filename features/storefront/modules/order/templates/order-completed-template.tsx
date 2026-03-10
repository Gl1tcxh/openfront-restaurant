import { OrderStatusTimeline, OrderStatus, OrderType } from "../components/order-status-timeline";
import { OrderItemsList } from "../components/order-items-list";
import { OrderSummary } from "../components/order-summary";
import { OrderDetailsCard } from "../components/order-details-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

const STATUS_LABEL: Record<string, string> = {
  open: "Received",
  sent_to_kitchen: "Sent to Kitchen",
  in_progress: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: "Dine-in",
  takeout: "Takeout",
  delivery: "Delivery",
};

export default function OrderCompletedTemplate({ order }: OrderCompletedTemplateProps) {
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;
  const typeLabel = ORDER_TYPE_LABEL[order.orderType] ?? order.orderType;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back link */}
      <div className="pb-4">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={12} />
          Back to orders
        </Link>
      </div>

      {/* Order header */}
      <div className="pb-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif">Order #{order.orderNumber}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {typeLabel}
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  order.status === "completed"
                    ? "bg-emerald-500"
                    : order.status === "cancelled"
                    ? "bg-red-500"
                    : order.status === "ready"
                    ? "bg-purple-500"
                    : "bg-amber-500"
                }`}
              />
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: status + details */}
        <div className="space-y-8">
          <div className="rounded-lg border border-border bg-card p-5">
            <OrderStatusTimeline status={order.status} orderType={order.orderType} />
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
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
        </div>

        {/* Right column: items + summary */}
        <div className="space-y-8">
          <div className="rounded-lg border border-border bg-card p-5">
            <OrderItemsList items={order.orderItems} />
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
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
  );
}
