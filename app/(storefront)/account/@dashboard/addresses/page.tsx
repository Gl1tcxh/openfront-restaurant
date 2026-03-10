import { Metadata } from "next"
import { getUser } from "@/features/storefront/lib/data/user"
import { AddressBook } from "@/features/storefront/components/AddressBook"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your saved addresses.",
}

export default async function AccountAddressesPage() {
  const user = await getUser()

  if (!user) {
    notFound()
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-border">
        <h1 className="text-3xl font-serif">Saved Addresses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your delivery addresses for a faster checkout experience.
        </p>
      </div>
      <div className="pt-6">
        <AddressBook addresses={user.addresses || []} />
      </div>
    </div>
  )
}
