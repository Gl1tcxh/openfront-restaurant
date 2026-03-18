import Nav from "@/features/storefront/modules/layout/templates/nav"
import Footer from "@/features/storefront/modules/layout/templates/footer"
import StorefrontServer from "./StorefrontServer"

export async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <StorefrontServer
      prefetchUser={true}
      prefetchCart={true}
    >
      <Nav />
      {children}
      <Footer />
    </StorefrontServer>
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
