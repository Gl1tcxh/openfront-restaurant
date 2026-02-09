import { Metadata } from "next"
import { getUser } from "@/features/storefront/lib/data/user"
import ProfileName from "@/features/storefront/modules/account/components/profile-name"
import ProfileEmail from "@/features/storefront/modules/account/components/profile-email"
import ProfilePhone from "@/features/storefront/modules/account/components/profile-phone"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your store profile.",
}

export default async function AccountProfilePage() {
  const customer = await getUser()

  if (!customer) {
    notFound()
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-y-2">
        <h1 className="text-3xl font-serif">Profile</h1>
        <p className="text-muted-foreground">
          View and update your profile information, including your name, email,
          and phone number.
        </p>
      </div>
      <div className="flex flex-col gap-y-6 w-full">
        <ProfileName customer={customer} />
        <ProfileEmail customer={customer} />
        <ProfilePhone customer={customer} />
      </div>
    </div>
  )
}
