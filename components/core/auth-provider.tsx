"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { AuthDialog } from "@/components/core/auth-dialog"

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  isAuthDialogOpen: boolean
  openAuthDialog: (nextPath?: string) => void
  closeAuthDialog: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)
  const requiresAuth = searchParams.get("auth") === "required"
  const requestedPath = searchParams.get("next")
  const shouldForceOpenDialog = requiresAuth && !user

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) {
        return
      }

      setUser(data.user ?? null)
      setIsAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!requiresAuth || !user) {
      return
    }

    if (requestedPath) {
      router.replace(requestedPath)
      return
    }

    router.replace("/app")
  }, [requiresAuth, requestedPath, router, user])

  const openAuthDialog = useCallback((requestedPath?: string) => {
    setIsAuthDialogOpen(true)
    if (requestedPath) {
      setNextPath(requestedPath)
    }
  }, [])

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false)
  }, [])

  const handleAuthenticated = useCallback(() => {
    setIsAuthDialogOpen(false)

    const redirectPath = nextPath ?? requestedPath ?? "/app"
    setNextPath(null)

    if (pathname === "/") {
      router.replace(redirectPath)
      return
    }

    router.push(redirectPath)
  }, [nextPath, pathname, requestedPath, router])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNextPath(null)
    if (pathname.startsWith("/app")) {
      router.replace("/")
      return
    }
    router.refresh()
  }, [pathname, router, supabase])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        isAuthDialogOpen: isAuthDialogOpen || shouldForceOpenDialog,
        openAuthDialog,
        closeAuthDialog,
        signOut,
      }}
    >
      {children}
      <AuthDialog
        open={isAuthDialogOpen || shouldForceOpenDialog}
        onOpenChange={setIsAuthDialogOpen}
        onAuthenticated={handleAuthenticated}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
