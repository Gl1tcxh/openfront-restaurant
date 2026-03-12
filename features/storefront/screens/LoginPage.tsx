"use client"

import { useState, useActionState } from "react"
import { login, signUp } from "@/features/storefront/lib/data/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [view, setView] = useState<"signin" | "signup">("signin")
  const [signinError, signinAction, isSigninPending] = useActionState(login, null)
  const [signupError, signupAction, isSignupPending] = useActionState(signUp, null)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-serif text-3xl text-center">
          {view === "signin" ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {view === "signin"
            ? "Sign in to your account to view orders and manage addresses."
            : "Join us for a faster checkout experience and order history."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {view === "signin" ? (
          <form action={signinAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {signinError && (
              <p className="text-sm text-destructive font-medium">{signinError}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSigninPending}>
              {isSigninPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
        ) : (
          <form action={signupAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <Input id="signup-name" name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-phone">Phone Number</Label>
              <Input id="signup-phone" name="phone" type="tel" placeholder="(555) 000-0000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" name="password" type="password" required />
            </div>
            {signupError && (
              <p className="text-sm text-destructive font-medium">{signupError}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSignupPending}>
              {isSignupPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground w-full">
          {view === "signin" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setView("signup")} className="text-primary hover:underline font-medium">
                Join us
              </button>
            </>
          ) : (
            <>
              Already a member?{" "}
              <button onClick={() => setView("signin")} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </>
          )}
        </div>
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Menu
        </Link>
      </CardFooter>
    </Card>
  )
}
