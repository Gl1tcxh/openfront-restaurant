"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type StorefrontSectionLinkProps = {
  href: string
  className?: string
  children: ReactNode
  prefetch?: boolean
}

function getTargetId(href: string) {
  if (href.startsWith("/#")) return href.slice(2)
  if (href.startsWith("#")) return href.slice(1)
  return null
}

export function StorefrontSectionLink({
  href,
  className,
  children,
  prefetch,
}: StorefrontSectionLinkProps) {
  const pathname = usePathname()
  const targetId = getTargetId(href)
  const isSamePageSectionLink = pathname === "/" && Boolean(targetId)

  if (isSamePageSectionLink && targetId) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          const section = document.getElementById(targetId)
          if (!section) return
          section.scrollIntoView({ block: "start" })
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <Link href={href} className={className} prefetch={prefetch}>
      {children}
    </Link>
  )
}
