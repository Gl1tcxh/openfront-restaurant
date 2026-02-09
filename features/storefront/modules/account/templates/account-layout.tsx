import React from "react"
import AccountNav from "../components/account-nav"

interface AccountLayoutProps {
  user: any;
  children: React.ReactNode;
}

export default function AccountLayout({
  user,
  children,
}: AccountLayoutProps) {
  return (
    <div className="flex-1 bg-background" data-testid="account-page">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          <AccountNav user={user} />
          <div className="flex-1 p-6 md:p-12 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}
