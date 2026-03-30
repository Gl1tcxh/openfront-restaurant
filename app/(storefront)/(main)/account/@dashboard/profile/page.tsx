import { Metadata } from "next"
import { getUser } from "@/features/storefront/lib/data/user"
import ProfileName from "@/features/storefront/modules/account/components/profile-name"
import ProfileEmail from "@/features/storefront/modules/account/components/profile-email"
import ProfilePhone from "@/features/storefront/modules/account/components/profile-phone"
import ProfileBillingAddress from "@/features/storefront/modules/account/components/profile-billing-address"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your profile.",
}

export default async function AccountProfilePage() {
  const customer = await getUser()

  if (!customer) {
    notFound()
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6">
        <h1 className="text-3xl font-serif">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your name, email address, phone number, and billing address.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border rounded-lg border border-border overflow-hidden">
        <ProfileName customer={customer} />
        <ProfileEmail customer={customer} />
        <ProfilePhone customer={customer} />
        <ProfileBillingAddress customer={customer} />
      </div>
    </div>
  )
}
