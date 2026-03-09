import { getUser, getUserOrders } from "@/features/storefront/lib/data/user";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { getStoreSettings } from "@/features/storefront/lib/data/menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, MapPin, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AccountOverviewPage() {
  const user = await getUser();
  const orders = await getUserOrders();
  const storeSettings = await getStoreSettings();
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  }

  if (!user) notFound();

  const completion = getProfileCompletion(user);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-y-2">
        <h1 className="text-3xl font-serif">Hello, {user.firstName || user.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Welcome back to your account overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-x-2">
              <span className="text-3xl font-bold">{completion}%</span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <Link href="/account/profile" className="inline-flex items-center text-xs text-primary hover:underline mt-4">
              Edit profile <ChevronRight size={12} />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-x-2">
              <span className="text-3xl font-bold">{user.addresses?.length || 0}</span>
              <span className="text-xs text-muted-foreground">Saved</span>
            </div>
            <Link href="/account/addresses" className="inline-flex items-center text-xs text-primary hover:underline mt-4">
              Manage addresses <ChevronRight size={12} />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-x-2">
              <span className="text-3xl font-bold">{orders.length}</span>
              <span className="text-xs text-muted-foreground">Placed</span>
            </div>
            <Link href="/account/orders" className="inline-flex items-center text-xs text-primary hover:underline mt-4">
              View history <ChevronRight size={12} />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif">Recent Orders</h3>
          <Link href="/account/orders" className="text-sm text-primary hover:underline flex items-center">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12 bg-muted/20 border-dashed">
            <CardContent>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground italic">You haven't placed any orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order: any) => (
              <Link key={order.id} href={`/account/orders/details/${order.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer group mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Order #{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(order.total, currencyConfig)}</p>
                        <p className="text-[10px] uppercase tracking-tighter text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-end">
                          View Details <ChevronRight size={10} />
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getProfileCompletion(user: any) {
  let count = 0;
  if (user.email) count++;
  if (user.firstName && user.lastName) count++;
  if (user.phone) count++;
  if (user.addresses?.length > 0) count++;
  return Math.round((count / 4) * 100);
}
