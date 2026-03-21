"use client"

import { useMemo, useState } from "react"
import { Eye, EyeOff, Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated?: () => void
}

export function AuthDialog({ open, onOpenChange, onAuthenticated }: AuthDialogProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setStatusMessage(null)

    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    if (mode === "sign-up" && password.length < 6) {
      setError("Password must be at least 6 characters.")
      setIsLoading(false)
      return
    }

    if (mode === "sign-up") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/app?emailConfirmed=1` : undefined,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        setIsLoading(false)
        onAuthenticated?.()
        return
      }

      setStatusMessage("Sign-up successful. Check your email to confirm your account.")
      setIsLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onAuthenticated?.()
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setError(null)
    setStatusMessage(null)
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.href : undefined,
      },
    })

    if (signInError) {
      setError(signInError.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-y-auto">
        <DialogTitle className="sr-only">{mode === "sign-in" ? "Sign in to your account" : "Create your account"}</DialogTitle>
        <DialogDescription className="sr-only">
          Use Google, GitHub, or your email and password.
        </DialogDescription>

        <div className="w-full p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{mode === "sign-in" ? "Welcome back" : "Create account"}</h1>
            <p className="mt-2 text-muted-foreground">
              {mode === "sign-in" ? "Sign in to your account to continue" : "Sign up to save and manage calculation history"}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-3">
              {/* <Button
                variant="outline"
                className="h-11 w-full justify-start gap-3 border-border bg-secondary/50 text-foreground hover:bg-secondary"
                onClick={() => handleOAuthLogin("google")}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button> */}

              <Button
                variant="outline"
                className="h-11 w-full justify-start gap-3 border-border bg-secondary/50 text-foreground hover:bg-secondary"
                onClick={() => handleOAuthLogin("github")}
              >
                <Github className="h-5 w-5" />
                Continue with GitHub
              </Button>
            </div>

            <div className="relative my-6">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs uppercase text-muted-foreground">
                or
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-11 border-border bg-secondary/50"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={mode === "sign-in" ? "Enter your password" : "Create a password"}
                      required
                      className="h-11 border-border bg-secondary/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {mode === "sign-up" ? <FieldDescription>Use at least 6 characters.</FieldDescription> : null}
                </Field>

                {mode === "sign-up" ? (
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repeat your password"
                        required
                        className="h-11 border-border bg-secondary/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                ) : null}

                <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                  {isLoading ? (mode === "sign-in" ? "Signing in..." : "Creating account...") : mode === "sign-in" ? "Sign in" : "Sign up"}
                </Button>

                <FieldError>{error}</FieldError>
                {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
              </FieldGroup>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))
                  setError(null)
                  setStatusMessage(null)
                }}
              >
                {mode === "sign-in" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
