import { Plus_Jakarta_Sans, Sora } from "next/font/google"
import Nav from "@/features/storefront/modules/layout/templates/nav"
import Footer from "@/features/storefront/modules/layout/templates/footer"
import StorefrontServer from "./StorefrontServer"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
})

export async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plusJakarta.variable} ${sora.variable} min-h-screen bg-background font-sans text-foreground`}>
      <StorefrontServer>
        <Nav />
        {children}
        <Footer />
      </StorefrontServer>
    </div>
  )
}

export function MainNotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="text-xs font-normal text-foreground">
        The page you tried to access does not exist.
      </p>
    </div>
  )
}
