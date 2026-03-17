"use client";

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
}

const PICKUP_STEPS: StatusStep[] = [
  { status: "open", label: "Received" },
  { status: "sent_to_kitchen", label: "Kitchen" },
  { status: "in_progress", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Picked Up" },
];

const DELIVERY_STEPS: StatusStep[] = [
  { status: "open", label: "Received" },
  { status: "sent_to_kitchen", label: "Kitchen" },
  { status: "in_progress", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "served", label: "On the Way" },
  { status: "completed", label: "Delivered" },
];

const DINE_IN_STEPS: StatusStep[] = [
  { status: "open", label: "Received" },
  { status: "sent_to_kitchen", label: "Kitchen" },
  { status: "in_progress", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "served", label: "Served" },
  { status: "completed", label: "Completed" },
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
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Status</h3>
        <div className="text-destructive text-sm font-medium">Order Cancelled</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Status</h3>
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="flex-1 truncate">
              {/* Progress bar segment */}
              <div className="flex w-full items-center [&>*]:h-1.5">
                <div
                  className={`relative flex h-1.5 w-full items-center rounded-full ${
                    isCompleted ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <div
                    className={`h-full flex-col rounded-full ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              </div>
              {/* Label below */}
              <div className="mt-2 truncate">
                <p
                  className={`text-xs truncate ${
                    isCompleted
                      ? isCurrent
                        ? "text-foreground font-medium"
                        : "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
