"use client";

import React, { useState, useTransition } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoreVertical, ArrowRight, Utensils, User, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { StatusDot, statusConfig } from "./StatusDot";
import { updateOrderStatus } from "../actions";
import { toast } from "sonner";

export const OrderDetailsComponent = ({
  order,
}: {
  order: any;
}) => {
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

  const activeStatus = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.open;
  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    ...config,
  }));

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.id} className="border-0">
        <div className="px-4 md:px-6 py-4 flex justify-between w-full border-b relative min-h-[100px] hover:bg-muted/40 transition-colors group">
          <div className="flex flex-col items-start text-left gap-2 sm:gap-1.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href={`/dashboard/platform/orders/${order.id}`}
                className="font-bold text-lg hover:text-blue-600 transition-colors"
              >
                #{order.orderNumber}
              </Link>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <Badge 
                color="zinc" 
                className="text-[.7rem] py-0 px-3 tracking-wide font-bold rounded-md border h-6 uppercase"
              >
                {order.orderType?.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-1 text-sm">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <User size={14} className="text-muted-foreground" />
                    <span>{order.customerName || order.customerEmail || "Guest"}</span>
                </div>
                {order.tables?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Utensils size={14} className="text-muted-foreground" />
                        <span>Table {order.tables.map((t: any) => t.tableNumber).join(", ")}</span>
                    </div>
                )}
            </div>
          </div>

          <div className="flex flex-col items-end justify-between">
            <div className="flex items-center gap-4">
              <span className="font-extrabold text-xl text-foreground">{formatCurrency(order.total)}</span>

              <div className="flex items-center">
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
                    {statusOptions.map((opt) => (
                      <SelectItem 
                        key={opt.value} 
                        value={opt.value}
                        className="py-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <StatusDot status={opt.value as keyof typeof statusConfig} size="sm" />
                          <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="border [&_svg]:size-3 h-6 w-6"
                        >
                            <MoreVertical className="stroke-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/platform/orders/${order.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/platform/orders/${order.id}/fulfill`}>Kitchen Prep</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="secondary"
                  size="icon"
                  className="border [&_svg]:size-3 h-6 w-6"
                  asChild
                >
                  <AccordionTrigger className="py-0" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <AccordionContent className="bg-muted/20 pb-0 border-b">
          <div className="p-4 md:px-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">Items</h4>
                    <div className="space-y-3">
                        {order.orderItems?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div className="flex gap-3">
                                    <span className="font-bold text-primary">{item.quantity}x</span>
                                    <span>{item.menuItem?.name}</span>
                                </div>
                                <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="border-l pl-8">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">Service Info</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Source</span>
                            <span className="capitalize">{order.orderSource || 'online'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Server</span>
                            <span>{order.server?.name || order.createdBy?.name || "Unassigned"}</span>
                        </div>
                        {order.orderType === 'delivery' && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Address</span>
                                <span className="text-right truncate max-w-[200px]">{order.deliveryAddress}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/platform/orders/${order.id}`}>
                                Full Order Dashboard <ArrowRight size={14} className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
             </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
