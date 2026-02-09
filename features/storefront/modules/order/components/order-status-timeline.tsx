"use client";

import { CheckCircle, Clock, ChefHat, Bell, Package, Truck } from "lucide-react";

export type OrderStatus =
  | "open"
  | "sent_to_kitchen"
  | "in_progress"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export type OrderType = "dine_in" | "takeout" | "delivery";

interface StatusStep {
  status: OrderStatus;
  label: string;
  icon: React.ReactNode;
}

const PICKUP_STEPS: StatusStep[] = [
  { status: "open", label: "Order Received", icon: <CheckCircle className="h-5 w-5" /> },
  { status: "sent_to_kitchen", label: "Sent to Kitchen", icon: <Clock className="h-5 w-5" /> },
  { status: "in_progress", label: "Preparing", icon: <ChefHat className="h-5 w-5" /> },
  { status: "ready", label: "Ready for Pickup", icon: <Bell className="h-5 w-5" /> },
  { status: "completed", label: "Picked Up", icon: <Package className="h-5 w-5" /> },
];

const DELIVERY_STEPS: StatusStep[] = [
  { status: "open", label: "Order Received", icon: <CheckCircle className="h-5 w-5" /> },
  { status: "sent_to_kitchen", label: "Sent to Kitchen", icon: <Clock className="h-5 w-5" /> },
  { status: "in_progress", label: "Preparing", icon: <ChefHat className="h-5 w-5" /> },
  { status: "ready", label: "Ready", icon: <Bell className="h-5 w-5" /> },
  { status: "served", label: "Out for Delivery", icon: <Truck className="h-5 w-5" /> },
  { status: "completed", label: "Delivered", icon: <Package className="h-5 w-5" /> },
];

const DINE_IN_STEPS: StatusStep[] = [
  { status: "open", label: "Order Received", icon: <CheckCircle className="h-5 w-5" /> },
  { status: "sent_to_kitchen", label: "Sent to Kitchen", icon: <Clock className="h-5 w-5" /> },
  { status: "in_progress", label: "Preparing", icon: <ChefHat className="h-5 w-5" /> },
  { status: "ready", label: "Ready", icon: <Bell className="h-5 w-5" /> },
  { status: "served", label: "Served", icon: <Package className="h-5 w-5" /> },
  { status: "completed", label: "Completed", icon: <CheckCircle className="h-5 w-5" /> },
];

function getStepsForOrderType(orderType: OrderType): StatusStep[] {
  switch (orderType) {
    case "delivery":
      return DELIVERY_STEPS;
    case "takeout":
      return PICKUP_STEPS;
    case "dine_in":
    default:
      return DINE_IN_STEPS;
  }
}

function getStepIndex(steps: StatusStep[], status: OrderStatus): number {
  const index = steps.findIndex((s) => s.status === status);
  return index === -1 ? 0 : index;
}

interface OrderStatusTimelineProps {
  status: OrderStatus;
  orderType: OrderType;
}

export function OrderStatusTimeline({ status, orderType }: OrderStatusTimelineProps) {
  const steps = getStepsForOrderType(orderType);
  const currentIndex = getStepIndex(steps, status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Status</h3>
      <div className="relative">
        <div className="absolute left-[18px] top-0 h-full w-0.5 bg-muted" />
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={step.status} className="relative flex items-center gap-4">
                <div
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-background text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  {step.icon}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-sm text-muted-foreground">Current status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
