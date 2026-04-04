import { StorefrontSectionLink } from "@/features/storefront/components/StorefrontSectionLink"

interface CategoryNavProps {
  items: Array<{
    href: string
    label: string
  }>
}

export function CategoryNav({ items }: CategoryNavProps) {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur">
      <div className="storefront-shell">
        <div className="flex gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <StorefrontSectionLink
              key={item.href}
              href={item.href}
              prefetch={false}
              className="whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {item.label}
            </StorefrontSectionLink>
          ))}
        </div>
      </div>
    </div>
  )
}
