import Link from "next/link"

interface CategoryNavProps {
  items: Array<{
    href: string
    label: string
  }>
}

export function CategoryNav({ items }: CategoryNavProps) {
  return (
    <div className="bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
