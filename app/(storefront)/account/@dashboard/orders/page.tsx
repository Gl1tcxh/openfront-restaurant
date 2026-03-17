import { Metadata } from "next"
import { getUser, getUserOrders } from "@/features/storefront/lib/data/user"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { getStoreSettings } from "@/features/storefront/lib/data/menu"
import { Package, ChevronRight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Orders",
  description: "View your order history.",
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  ready: "bg-purple-500",
  served: "bg-teal-500",
  sent_to_kitchen: "bg-orange-500",
}

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-zinc-400"
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} />
}

export default async function AccountOrdersPage() {
  const user = await getUser()
  const orders = await getUserOrders()
  const storeSettings = await getStoreSettings()
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  }

  if (!user) notFound()

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-serif">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length > 0
            ? `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`
            : "No orders yet."}
        </p>
      </div>

      <div className="pt-6">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 py-16 text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
            <Link
              href="/"
              className="inline-block mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Start browsing our menu
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/account/orders/details/${order.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-muted/20 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusDot status={order.status} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold truncate">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground hidden sm:inline">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {order.orderItems?.length > 0 && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          · {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold">
                    {formatCurrency(order.total, currencyConfig)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
