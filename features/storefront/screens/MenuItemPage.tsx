import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock3, Flame, Tag } from "lucide-react"
import { getCurrencyConfig, formatCurrency } from "@/features/storefront/lib/currency"
import { getMenuItem, getStoreSettings } from "@/features/storefront/lib/data/menu"
import {
  getMenuItemDescriptionText,
} from "@/features/storefront/lib/menu-item-utils"
import { MenuItemPurchaseForm } from "@/features/storefront/components/MenuItemPurchaseForm"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  const [item, storeSettings] = await Promise.all([getMenuItem(id), getStoreSettings()])

  if (!item) {
    return {
      title: "Menu Item",
    }
  }

  const storeName = storeSettings?.name || "Restaurant"
  const description = getMenuItemDescriptionText(item.description)
  const thumbnail = item.thumbnail || "/placeholder.jpg"

  return {
    title: `${item.name} | ${storeName}`,
    description: description || `${item.name} from ${storeName}`,
    openGraph: {
      title: `${item.name} | ${storeName}`,
      description: description || `${item.name} from ${storeName}`,
      images: [thumbnail],
    },
  }
}

export default async function MenuItemPage(props: Props) {
  const { id } = await props.params
  const [item, storeSettings] = await Promise.all([getMenuItem(id), getStoreSettings()])

  if (!item) {
    notFound()
  }

  const currencyConfig = getCurrencyConfig(storeSettings)
  const description = getMenuItemDescriptionText(item.description)
  const thumbnail = item.thumbnail || "/placeholder.jpg"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-8 lg:px-10 lg:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Menu
        </Link>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
          {/* Image */}
          <section>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-lg shadow-foreground/5">
              <Image
                src={thumbnail}
                alt={item.name}
                fill
                className="object-cover"
                priority
              />
              {item.featured && (
                <span className="absolute left-4 top-4 rounded-full bg-warm-500 text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]">
                  Featured
                </span>
              )}
            </div>
          </section>

          {/* Details sidebar */}
          <section className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {item.mealPeriods?.[0] ? (
                  <span className="bg-muted rounded-full px-3 py-1">{item.mealPeriods[0].replace(/_/g, " ")}</span>
                ) : null}
                {item.category && typeof item.category === "object" ? (
                  <span className="bg-muted rounded-full px-3 py-1">{item.category.name}</span>
                ) : null}
              </div>
              <h1 className="font-serif font-bold text-4xl leading-[0.95] tracking-tight md:text-5xl">
                {item.name}
              </h1>
              <p className="mt-4 text-2xl font-semibold text-foreground tabular-nums">
                {formatCurrency(item.price, currencyConfig)}
              </p>
              {description && (
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            {/* At a Glance */}
            <div className="rounded-2xl bg-muted/60 p-5 border border-border/50">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                At a Glance
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/50">
                    <Clock3 className="h-4 w-4 text-warm-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">Prep</span>
                    <p className="text-sm font-semibold text-foreground">
                      {item.prepTime ? `${item.prepTime} min` : "House made"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/50">
                    <Flame className="h-4 w-4 text-warm-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">Calories</span>
                    <p className="text-sm font-semibold text-foreground">
                      {item.calories ? `${item.calories}` : "Seasonal"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/50">
                    <Tag className="h-4 w-4 text-warm-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block">Station</span>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {item.kitchenStation ? item.kitchenStation : "Chef line"}
                    </p>
                  </div>
                </div>
              </div>

              {(item.dietaryFlags?.length > 0 || item.allergens?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {item.dietaryFlags?.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded-full bg-warm-100 text-warm-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
                      >
                        {flag.replace(/_/g, " ")}
                      </span>
                    ))}
                    {item.allergens?.map((allergen: string) => (
                      <span
                        key={allergen}
                        className="rounded-full bg-background border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {allergen.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customize & Add to Cart */}
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 md:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Customize Your Order
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Select modifiers and add to your cart.
                </p>
              </div>
              <MenuItemPurchaseForm
                item={item}
                currencyCode={currencyConfig.currencyCode}
                locale={currencyConfig.locale}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
