import { Metadata } from "next"
import { getUser, getUserOrders } from "@/features/storefront/lib/data/user"
import { formatCurrency } from "@/features/storefront/lib/currency"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ChevronRight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Orders",
  description: "View your order history.",
}

export default async function AccountOrdersPage() {
  const user = await getUser()
  const orders = await getUserOrders()

  if (!user) {
    notFound()
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-y-2">
        <h1 className="text-3xl font-serif">Order History</h1>
        <p className="text-muted-foreground">
          View your previous orders and their current status.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12 bg-muted/20 border-dashed">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground italic">You haven't placed any orders yet.</p>
            <Link href="/" className="inline-block mt-4 text-sm text-primary hover:underline">
              Start browsing our menu
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/details/${order.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer group mb-4">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-lg">Order #{order.orderNumber}</span>
                        <Badge variant={
                          order.status === 'completed' ? 'success' : 
                          order.status === 'cancelled' ? 'destructive' : 
                          'secondary'
                        }>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-bold text-xl">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{order.orderType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex gap-2">
                       {order.items?.slice(0, 3).map((item: any) => (
                         <span key={item.id} className="text-xs bg-muted px-2 py-1 rounded">
                           {item.quantity}x {item.menuItem?.name}
                         </span>
                       ))}
                       {order.items?.length > 3 && (
                         <span className="text-xs text-muted-foreground py-1">
                           +{order.items.length - 3} more
                         </span>
                       )}
                    </div>
                    <div className="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1 text-sm font-medium">
                       Details <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
