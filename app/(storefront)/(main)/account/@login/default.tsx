import LoginPage from "@/features/storefront/screens/LoginPage"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function Default() {
  return <LoginPage />
}
