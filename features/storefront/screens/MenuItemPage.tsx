import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock3, Flame, Tag } from "lucide-react"
import { getCurrencyConfig, formatCurrency } from "@/features/storefront/lib/currency"
import { getMenuItem, getStoreSettings } from "@/features/storefront/lib/data/menu"
import {
  getMenuItemDescriptionText,
  getMenuItemImageUrl,
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

  return {
    title: `${item.name} | ${storeName}`,
    description: description || `${item.name} from ${storeName}`,
    openGraph: {
      title: `${item.name} | ${storeName}`,
      description: description || `${item.name} from ${storeName}`,
      images: [getMenuItemImageUrl(item)],
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 md:px-8 lg:px-10 lg:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
          <section>
            <div className="relative aspect-[0.95] overflow-hidden rounded-2xl bg-muted ring-1 ring-border shadow-md shadow-foreground/5">
              <Image
                src={getMenuItemImageUrl(item)}
                alt={item.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <div className="mb-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {item.mealPeriods?.[0] ? (
                  <span>{item.mealPeriods[0].replace(/_/g, " ")}</span>
                ) : null}
                {item.category && typeof item.category === "object" ? (
                  <>
                    <span>•</span>
                    <span>{item.category.name}</span>
                  </>
                ) : null}
              </div>
              <h1 className="font-serif text-4xl leading-[0.95] tracking-tight md:text-5xl">
                {item.name}
              </h1>
              <p className="mt-4 text-2xl font-semibold text-foreground">
                {formatCurrency(item.price, currencyConfig)}
              </p>
              {description && (
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-md shadow-foreground/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                At a Glance
              </p>
              <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      Prep
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {item.prepTime ? `${item.prepTime} min` : "House made"}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      Calories
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {item.calories ? `${item.calories}` : "Seasonal"}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      Station
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {item.kitchenStation ? item.kitchenStation : "Chef line"}
                  </p>
                </div>
              </div>

              {(item.dietaryFlags?.length || item.allergens?.length) && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    {item.dietaryFlags?.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground"
                      >
                        {flag.replace(/_/g, " ")}
                      </span>
                    ))}
                    {item.allergens?.map((allergen: string) => (
                      <span
                        key={allergen}
                        className="rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground"
                      >
                        {allergen.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-card ring-1 ring-border shadow-md shadow-foreground/5">
              <div className="px-5 pt-5 md:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Customize
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose your modifiers and send the finished order straight to the cart.
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
