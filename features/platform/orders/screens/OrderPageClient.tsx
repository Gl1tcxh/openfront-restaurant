"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  Phone,
  ShoppingBag,
  MapPin,
  Utensils,
  ChevronRight,
  Printer,
  Calendar,
  CreditCard,
  History,
  Info,
  ChefHat,
  MoreVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { updateOrderStatus } from "../actions";
import { toast } from "sonner";
import { StatusDot, statusConfig } from "../components/StatusDot";


interface OrderPageClientProps {
  order: any;
}

export function OrderPageClient({ order }: OrderPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(order.status);

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (result.success) {
        setCurrentStatus(newStatus);
        toast.success(`Order updated to ${newStatus.replace('_', ' ')}`);
      } else {
        toast.error("Failed to update order status");
      }
    });
  };

  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    ...config,
  }));

  const activeStatus = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.open;

  return (
    <div className="bg-muted/30 min-h-full pb-20">
      <div className="max-w-6xl p-4 md:p-8 mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link
              href="/dashboard/platform/orders"
              className="inline-flex items-center text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back to Orders
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                Order <span className="text-muted-foreground/50">#</span>{order.orderNumber}
              </h1>
              <Badge 
                color="zinc" 
                className="text-[.7rem] py-0 px-3 tracking-wide font-bold rounded-md border h-6 uppercase"
              >
                {order.orderType?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 opacity-70" />
                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1.5 capitalize">
                <ShoppingBag className="h-4 w-4 opacity-70" />
                {order.orderSource || 'online'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 self-start lg:self-center">
            <span className="text-3xl font-black text-foreground">
              {formatCurrency(order.total)}
            </span>

            <div className="flex items-center gap-3">
              <Select 
                value={currentStatus} 
                onValueChange={handleStatusChange}
                disabled={isPending}
              >
                <SelectTrigger className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted border shadow-xs text-muted-foreground h-auto w-auto focus:ring-0">
                  <StatusDot status={currentStatus as keyof typeof statusConfig} size="sm" />
                  <span className="uppercase tracking-wide">{activeStatus.label}</span>
                </SelectTrigger>
                <SelectContent align="end">
                  <div className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Change Status
                  </div>
                  {statusOptions.map((opt) => (
                    <SelectItem 
                      key={opt.value} 
                      value={opt.value}
                      className="py-2.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <StatusDot status={opt.value as keyof typeof statusConfig} size="sm" />
                        <span className="font-semibold text-foreground">{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="secondary" 
                size="icon" 
                className="border [&_svg]:size-3 h-6 w-6"
              >
                <Printer className="stroke-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Items Card */}
            <Card className="border shadow-xs overflow-hidden rounded-2xl bg-background">
              <CardHeader className="border-b py-5 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
                    <div className="bg-muted p-2 rounded-lg">
                      <Utensils className="h-4 w-4 text-muted-foreground" />
                    </div>
                    Order Items
                  </CardTitle>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    {order.orderItems?.length || 0} Items Total
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {order.orderItems?.map((item: any) => (
                    <div key={item.id} className="p-6 flex justify-between items-center hover:bg-muted/20 transition-colors group">
                      <div className="flex gap-5 items-center">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-foreground text-background font-bold shadow-md shrink-0">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-lg transition-colors leading-tight">
                            {item.menuItem?.name}
                          </p>
                          {item.specialInstructions ? (
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1 flex items-center gap-1.5">
                              <Info className="h-3 w-3" />
                              "{item.specialInstructions}"
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Standard preparation</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-foreground text-lg">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-xs text-muted-foreground font-medium">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions / Notes */}
            {order.specialInstructions && (
              <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/30 shadow-xs rounded-2xl overflow-hidden">
                <div className="flex items-stretch">
                  <div className="w-1.5 bg-orange-400" />
                  <div className="p-6 flex gap-4 items-start w-full">
                    <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg text-orange-700 dark:text-orange-400 shrink-0">
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-orange-900 dark:text-orange-300 uppercase tracking-widest mb-1">Kitchen Instructions</h4>
                      <p className="text-orange-800 dark:text-orange-400 font-medium leading-relaxed">{order.specialInstructions}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Payment & Summary */}
            <Card className="border shadow-xs rounded-2xl overflow-hidden bg-zinc-900 dark:bg-zinc-950 text-white">
              <CardHeader className="border-b border-zinc-800/50 py-5 px-6">
                <CardTitle className="text-base font-bold flex items-center gap-2.5">
                  <div className="bg-zinc-800 p-2 rounded-lg">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                  </div>
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Subtotal</span>
                    <span className="text-zinc-200">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 font-medium">
                    <span>Tax</span>
                    <span className="text-zinc-200">{formatCurrency(order.tax)}</span>
                  </div>
                  {order.tip > 0 && (
                    <div className="flex justify-between text-zinc-400 font-medium">
                      <span>Tip</span>
                      <span className="text-emerald-400">{formatCurrency(order.tip)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-zinc-400 font-medium">
                      <span>Discount</span>
                      <span className="text-rose-400">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-zinc-800 mt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Grand Total</span>
                      <span className="text-4xl font-black text-white">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {order.payments?.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-zinc-800">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                      <History className="h-3 w-3" /> Payment History
                    </p>
                    <div className="space-y-3">
                      {order.payments.map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
                          <div className="flex items-center gap-3">
                            <Badge className={`uppercase text-[10px] ${payment.status === 'captured' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-zinc-700'}`}>
                              {payment.status}
                            </Badge>
                            <span className="capitalize font-bold text-zinc-300">{payment.paymentMethod}</span>
                          </div>
                          <span className="font-extrabold text-white">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Customer Details */}
            <Card className="border shadow-xs rounded-2xl overflow-hidden bg-background">
              <CardHeader className="border-b py-5 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
                    <div className="bg-muted p-2 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    Customer
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {(order.customerName || "G")[0]}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{order.customerName || "Guest Customer"}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">{order.customerEmail || "No email"}</p>
                    </div>
                  </div>
                  
                  {order.customerPhone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{order.customerPhone}</span>
                    </div>
                  )}

                  <Link 
                    href={`/dashboard/platform/users/${order.customer?.id}`} 
                    className="flex items-center justify-between w-full p-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors group"
                  >
                    View profile
                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Service Info */}
            <Card className="border shadow-xs rounded-2xl overflow-hidden bg-background">
              <CardHeader className="border-b py-5 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
                    <div className="bg-muted p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    Service
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Server</span>
                    <span className="text-sm font-bold text-foreground">{order.server?.name || order.createdBy?.name || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Table(s)</span>
                    <div className="flex gap-1.5">
                      {order.tables?.length > 0 ? (
                        order.tables.map((t: any) => (
                          <Badge key={t.id} variant="secondary" className="bg-muted text-foreground hover:bg-muted/80 border-none">
                            T{t.tableNumber}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm font-bold text-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Guests</span>
                    <span className="text-sm font-bold text-foreground">{order.guestCount} People</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery */}
            {order.orderType === 'delivery' && (
              <Card className="border shadow-xs rounded-2xl overflow-hidden bg-background">
                <CardHeader className="border-b py-5 px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
                      <div className="bg-muted p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      Delivery
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 bg-muted/50 rounded-xl border space-y-2">
                    <p className="text-sm font-bold text-foreground leading-tight">{order.deliveryAddress}</p>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{order.deliveryCity}, {order.deliveryZip}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}