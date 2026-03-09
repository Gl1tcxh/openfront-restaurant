"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  CreditCard,
  MapPin,
  Phone,
  Printer,
  User,
  UtensilsCrossed,
  ChefHat,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { updateOrderStatus } from "../actions";
import { toast } from "sonner";
import { StatusDot, statusConfig } from "../components/StatusDot";

interface OrderPageClientProps {
  order: any;
  currencyCode?: string;
  locale?: string;
}

const NEXT_STATUS: Record<string, string | null> = {
  open: "sent_to_kitchen",
  sent_to_kitchen: "in_progress",
  in_progress: "ready",
  ready: "served",
  served: "completed",
  completed: null,
  cancelled: null,
};

function prettyStatus(value: string) {
  return value.replace(/_/g, " ");
}

export function OrderPageClient({ order, currencyCode = "USD", locale = "en-US" }: OrderPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(order.status);

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (result.success) {
        setCurrentStatus(newStatus);
        toast.success(`Order updated to ${prettyStatus(newStatus)}`);
      } else {
        toast.error("Failed to update order status");
      }
    });
  };

  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    ...config,
  }));

  const activeStatus =
    statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.open;

  const sourceTone =
    order.orderSource === "online"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  const suggestedNextStatus = NEXT_STATUS[currentStatus] || null;

  const nextActionLabel = useMemo(() => {
    if (!suggestedNextStatus) return null;
    if (suggestedNextStatus === "sent_to_kitchen") return "Send to kitchen";
    if (suggestedNextStatus === "in_progress") return "Mark preparing";
    if (suggestedNextStatus === "ready") return "Mark ready";
    if (suggestedNextStatus === "served") {
      if (order.orderType === "takeout") return "Mark handed off";
      if (order.orderType === "delivery") return "Mark dispatched";
      return "Mark served";
    }
    if (suggestedNextStatus === "completed") return "Close order";
    return `Set ${prettyStatus(suggestedNextStatus)}`;
  }, [suggestedNextStatus, order.orderType]);

  const operationsHint = useMemo(() => {
    if (currentStatus === "open") return "Order is received. Next step is sending it to kitchen production.";
    if (currentStatus === "sent_to_kitchen" || currentStatus === "in_progress") return "Kitchen is working this ticket. Track progress in KDS and mark ready when done.";
    if (currentStatus === "ready") {
      if (order.orderType === "takeout") return "Order is ready for pickup handoff.";
      if (order.orderType === "delivery") return "Order is ready to dispatch to courier/driver.";
      return "Order is ready to run to the table.";
    }
    if (currentStatus === "served") return "Food has been handed off. Final step is closing/completing the order.";
    if (currentStatus === "completed") return "Order is fully closed.";
    if (currentStatus === "cancelled") return "Order was cancelled.";
    return "Manage order progress from this page.";
  }, [currentStatus, order.orderType]);

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-50 via-background to-background dark:from-zinc-950 pb-12">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard/platform/orders"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to order board
          </Link>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Order #{order.orderNumber}</h1>
                <Badge className={`uppercase text-[10px] tracking-wider ${sourceTone}`}>
                  {order.orderSource || "online"}
                </Badge>
                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                  {order.orderType?.replace("_", " ") || "order"}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="text-right mr-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                <div className="text-3xl font-semibold leading-none">{formatCurrency(order.total, { currencyCode, locale })}</div>
              </div>

              <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="h-9 min-w-[165px] rounded-full px-3 text-sm font-medium [&>svg]:h-3 [&>svg]:w-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={currentStatus as keyof typeof statusConfig} size="sm" />
                    <span className="uppercase tracking-wide text-[11px]">{activeStatus.label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <StatusDot status={opt.value as keyof typeof statusConfig} size="sm" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border bg-muted/20">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">What to do next</div>
              <div className="text-sm font-medium">{operationsHint}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/platform/kds" className="inline-flex items-center gap-1">
                  <ChefHat className="h-4 w-4" /> Open KDS
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
              {suggestedNextStatus && nextActionLabel && (
                <Button
                  onClick={() => handleStatusChange(suggestedNextStatus)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {nextActionLabel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-base">Items in this order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.orderItems?.map((item: any) => (
                  <div key={item.id} className="rounded-xl border p-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {item.quantity}x {item.menuItem?.name}
                      </div>
                      {item.specialInstructions ? (
                        <div className="text-xs text-orange-600 mt-1">Note: {item.specialInstructions}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1">No special instructions</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.price * item.quantity, { currencyCode, locale })}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {order.specialInstructions && (
              <Card className="rounded-2xl border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="text-base">Kitchen instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.specialInstructions}</p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal, { currencyCode, locale })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(order.tax, { currencyCode, locale })}</span></div>
                {order.tip > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><span>{formatCurrency(order.tip, { currencyCode, locale })}</span></div>}
                {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
                <div className="pt-2 border-t flex justify-between font-semibold text-base"><span>Total</span><span>{formatCurrency(order.total, { currencyCode, locale })}</span></div>

                {order.payments?.length > 0 && (
                  <div className="pt-3 mt-3 border-t space-y-2">
                    {order.payments.map((payment: any) => (
                      <div key={payment.id} className="rounded-lg border px-3 py-2 flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {payment.paymentMethod} • {payment.status}
                        </div>
                        <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2"><User className="h-4 w-4" />Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold">{order.customerName || "Guest customer"}</div>
                  <div className="text-muted-foreground">{order.customerEmail || "No email"}</div>
                </div>
                {order.customerPhone && (
                  <div className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{order.customerPhone}</div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-base inline-flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" />Service context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Server</span><span>{order.server?.name || order.createdBy?.name || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span>{order.guestCount || 1}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tables</span><span>{order.tables?.length ? order.tables.map((t: any) => `T${t.tableNumber}`).join(", ") : "N/A"}</span></div>
              </CardContent>
            </Card>

            {order.orderType === "delivery" && (
              <Card className="rounded-2xl border">
                <CardHeader>
                  <CardTitle className="text-base inline-flex items-center gap-2"><MapPin className="h-4 w-4" />Delivery address</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{order.deliveryAddress}</p>
                  <p className="text-muted-foreground mt-1">{order.deliveryCity} {order.deliveryZip}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
