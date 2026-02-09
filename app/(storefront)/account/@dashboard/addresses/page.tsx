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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-y-2">
        <h1 className="text-3xl font-serif text-3xl">Saved Addresses</h1>
        <p className="text-muted-foreground">
          Manage your saved delivery addresses for a faster checkout experience.
        </p>
      </div>
      <div className="w-full">
        <AddressBook addresses={user.addresses || []} />
      </div>
    </div>
  )
}
