import {
  Geist,
  Geist_Mono,
  Unbounded,
} from "next/font/google"
import Nav from "@/features/storefront/modules/layout/templates/nav"
import Footer from "@/features/storefront/modules/layout/templates/footer"
import StorefrontServer from "./StorefrontServer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const unboundedDisplay = Unbounded({
  variable: "--font-unbounded-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})


export async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`storefront-ui ${geistSans.variable} ${unboundedDisplay.variable} ${geistMono.variable} min-h-dvh bg-background font-sans text-foreground antialiased`}
    >
      <StorefrontServer
        prefetchUser={true}
        prefetchCart={true}
        prefetchStoreSettings={true}
        prefetchMenuCategories={true}
      >
        <div className="relative flex min-h-dvh flex-col overflow-x-clip">
          <Nav />
          {children}
          <Footer />
        </div>
      </StorefrontServer>
    </div>
  )
}

export function MainNotFound() {
  return (
    <div className="storefront-shell flex min-h-[calc(100dvh-16rem)] flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="storefront-kicker">Not found</span>
      <h1 className="storefront-heading max-w-xl">This page is not on the menu.</h1>
      <p className="storefront-copy max-w-md">
        The page you tried to open does not exist or may have been removed.
      </p>
    </div>
  )
}
