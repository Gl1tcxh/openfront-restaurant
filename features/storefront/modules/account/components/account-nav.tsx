"use client"

import clsx from "clsx"
import {
  LogOut,
  User,
  MapPin,
  Package,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "@/features/storefront/lib/data/user"

interface AccountNavProps {
  user: any;
}

export default function AccountNav({ user }: AccountNavProps) {
  const route = usePathname()

  const handleLogout = async () => {
    await signOut()
  }

  const navLinks = [
    { href: "/account", label: "Overview", icon: Package },
    { href: "/account/profile", label: "Profile", icon: User },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
    { href: "/account/orders", label: "Orders", icon: Package },
  ]

  return (
    <div className="flex flex-col gap-y-8 py-12 px-6 border-r border-border min-h-[calc(100vh-128px)]">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Account</h3>
        <nav className="flex flex-col gap-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = route === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-x-2 text-sm font-medium p-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-x-2 text-sm font-medium p-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </nav>
      </div>
      
      <div className="mt-auto pt-6 border-t border-border">
         <p className="text-xs text-muted-foreground">Logged in as</p>
         <p className="text-sm font-medium truncate">{user?.email}</p>
      </div>
    </div>
  )
}
