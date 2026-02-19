"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormError } from "@/components/ui/form-error"
import { athleteLoginSchema, validateForm } from "@/lib/validations"
import Image from "next/image"
import { Loader2, AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")

  const errorMessage = error || (urlError === "AccessDenied"
    ? "No account found for this email."
    : urlError
      ? "Something went wrong. Please try again."
      : null)

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const errors = validateForm(athleteLoginSchema, { email })
    setFieldErrors(errors)
  }

  function fieldError(field: string) {
    return touched[field] ? fieldErrors[field] : undefined
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const errors = validateForm(athleteLoginSchema, { email })
    setFieldErrors(errors)
    setTouched({ email: true })

    if (Object.keys(errors).length > 0) return

    setIsLoading(true)

    try {
      const { signIn } = await import("next-auth/react")
      const result = await signIn("resend", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/",
      })

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setError("No account found for this email.")
        } else {
          setError("Something went wrong. Please try again.")
        }
        setIsLoading(false)
        return
      }

      window.location.href = "/check-email"
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="flex flex-col items-center space-y-3">
          <Image
            src="/logo-white.webp"
            alt="Cannoli Strength"
            width={220}
            height={55}
            className="h-12 w-auto brightness-0 dark:brightness-100"
            priority
          />
          <p className="text-sm text-muted-foreground">Sign in to Cannoli Trainer</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a login link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                  className={`h-12 text-base ${fieldError("email") ? "border-destructive" : ""}`}
                />
                <FormError message={fieldError("email")} />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending login link...
                  </>
                ) : (
                  "Send Login Link"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account? Contact your coach to get started.
        </p>

        {/* Dev bypass — controlled by ENABLE_DEV_LOGIN env var */}
        <DevLoginButtons />
      </div>
    </div>
  )
}

function DevLoginButtons() {
  const [loadingAthlete, setLoadingAthlete] = useState(false)
  const [loadingCoach, setLoadingCoach] = useState(false)

  async function handleDevLogin(provider: string, callbackUrl: string, setLoading: (v: boolean) => void) {
    setLoading(true)
    try {
      const { signIn } = await import("next-auth/react")
      const result = await signIn(provider, { redirect: false, callbackUrl })
      if (result?.error) {
        console.error("Dev login error:", result.error)
        setLoading(false)
        return
      }
      window.location.href = callbackUrl
    } catch (err) {
      console.error("Dev login exception:", err)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full border-dashed border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
        onClick={() => handleDevLogin("dev-login", "/athlete", setLoadingAthlete)}
        disabled={loadingAthlete || loadingCoach}
      >
        {loadingAthlete ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Dev Login (Athlete)"
        )}
      </Button>
      <Button
        variant="outline"
        className="w-full border-dashed border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
        onClick={() => handleDevLogin("dev-coach-login", "/dashboard", setLoadingCoach)}
        disabled={loadingAthlete || loadingCoach}
      >
        {loadingCoach ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Dev Login (Coach)"
        )}
      </Button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
