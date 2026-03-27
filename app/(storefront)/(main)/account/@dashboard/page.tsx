import { getUser, getUserOrders } from "@/features/storefront/lib/data/user";
import { formatCurrency } from "@/features/storefront/lib/currency";
import { getStoreSettings } from "@/features/storefront/lib/data/menu";
import { Badge } from "@/components/ui/badge";
import { Package, ChevronRight, MapPin, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AccountOverviewPage() {
  const user = await getUser();
  const orders = await getUserOrders();
  const storeSettings = await getStoreSettings();
  const currencyConfig = {
    currencyCode: storeSettings?.currencyCode || "USD",
    locale: storeSettings?.locale || "en-US",
  };

  if (!user) notFound();

  const completion = getProfileCompletion(user);
  const firstName = user.firstName || user.name?.split(" ")[0] || "there";

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-serif">Hello, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back to your account.
        </p>
      </div>

      <div className="grid grid-cols-3 divide-x border-b border-border">
        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Profile</p>
          <p className="text-2xl font-semibold mt-1">{completion}%</p>
          <Link
            href="/account/profile"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            Edit profile <ChevronRight size={11} />
          </Link>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Addresses</p>
          <p className="text-2xl font-semibold mt-1">{user.addresses?.length || 0}</p>
          <Link
            href="/account/addresses"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            Manage <ChevronRight size={11} />
          </Link>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Orders</p>
          <p className="text-2xl font-semibold mt-1">{orders.length}</p>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            View history <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      <div className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Orders</h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link
              href="/"
              className="inline-block mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Browse the menu
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y">
            {orders.slice(0, 4).map((order: any) => (
              <Link
                key={order.id}
                href={`/account/orders/details/${order.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Package size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
