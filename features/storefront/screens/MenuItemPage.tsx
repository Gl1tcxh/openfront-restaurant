import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock3, Flame, Tag } from "lucide-react"
import { getCurrencyConfig, formatCurrency } from "@/features/storefront/lib/currency"
import { getMenuItem, getStoreSettings } from "@/features/storefront/lib/data/menu"
import { getMenuItemDescriptionText } from "@/features/storefront/lib/menu-item-utils"
import { MenuItemPurchaseForm } from "@/features/storefront/components/MenuItemPurchaseForm"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params
  const [item, storeSettings] = await Promise.all([getMenuItem(id), getStoreSettings()])

  if (!item) {
    return { title: "Menu Item" }
  }

  const storeName = storeSettings?.name || "Restaurant"
  const description = getMenuItemDescriptionText(item.description)
  const image = item.thumbnail || undefined

  return {
    title: `${item.name} | ${storeName}`,
    description: description || `${item.name} from ${storeName}`,
    openGraph: image
      ? {
          title: `${item.name} | ${storeName}`,
          description: description || `${item.name} from ${storeName}`,
          images: [image],
        }
      : undefined,
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
  const categoryName = typeof item.category === "object" ? item.category?.name : null

  return (
    <main className="pb-12 pt-8 sm:pb-16 lg:pb-24">
      <div className="storefront-shell">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to menu
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <section className="space-y-6">
            <div className="relative overflow-hidden border border-border bg-muted">
              {item.thumbnail ? (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 52vw"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center p-8 text-center">
                  <div>
                    <p className="font-serif text-4xl font-semibold text-foreground">{item.name}</p>
                    <p className="mt-3 text-base text-muted-foreground">Prepared fresh to order</p>
                  </div>
                </div>
              )}

              {(item.featured || item.popular) && (
                <span className="absolute left-5 top-5 border border-border bg-background px-3 py-1 text-xs font-medium text-primary">
                  {item.featured ? "Featured" : "Popular"}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="storefront-surface bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 sm:block">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock3 className="size-4" />
                    <p className="text-sm font-medium text-foreground">Prep time</p>
                  </div>
                  <p className="truncate text-right text-base font-semibold text-foreground sm:mt-3 sm:text-left sm:text-xl">
                    {item.prepTime ? `${item.prepTime} min` : "Made to order"}
                  </p>
                </div>
              </div>

              <div className="storefront-surface bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 sm:block">
                  <div className="flex items-center gap-2 text-primary">
                    <Flame className="size-4" />
                    <p className="text-sm font-medium text-foreground">Calories</p>
                  </div>
                  <p className="truncate text-right text-base font-semibold text-foreground sm:mt-3 sm:text-left sm:text-xl">
                    {item.calories ? `${item.calories}` : "Seasonal"}
                  </p>
                </div>
              </div>

              <div className="storefront-surface bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 sm:block">
                  <div className="flex items-center gap-2 text-primary">
                    <Tag className="size-4" />
                    <p className="text-sm font-medium text-foreground">Station</p>
                  </div>
                  <p className="truncate text-right text-base font-semibold capitalize text-foreground sm:mt-3 sm:text-left sm:text-xl">
                    {item.kitchenStation || "Chef line"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {categoryName ? <span className="storefront-kicker">{categoryName}</span> : null}
                {item.mealPeriods?.[0] ? (
                  <span className="storefront-kicker">{item.mealPeriods[0].replace(/_/g, " ")}</span>
                ) : null}
              </div>

              <h1 className="text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                {item.name}
              </h1>

              <p className="text-2xl font-medium tabular-nums text-foreground">
                {formatCurrency(item.price, currencyConfig)}
              </p>

              {description ? (
                <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            {(item.dietaryFlags?.length > 0 || item.allergens?.length > 0) && (
              <div className="storefront-surface bg-card p-5">
                <p className="text-sm font-medium text-primary">Details</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.dietaryFlags?.map((flag: string) => (
                    <span
                      key={flag}
                      className="border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                  {item.allergens?.map((allergen: string) => (
                    <span
                      key={allergen}
                      className="border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                    >
                      {allergen.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="storefront-surface overflow-hidden bg-card">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <p className="text-sm font-medium text-primary">Customize your order</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose modifiers and add this item to your cart without leaving the product page.
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
