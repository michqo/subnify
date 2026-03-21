"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
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
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | null>(null)

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

  const openAuthDialog = useCallback((requestedPath?: string) => {
    setIsAuthDialogOpen(true)
    if (requestedPath) {
      setNextPath(requestedPath)
    }
  }, [])

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false)
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user ?? null)
  }, [supabase])

  const handleAuthenticated = useCallback(() => {
    setIsAuthDialogOpen(false)

    const redirectPath = nextPath ?? "/app"
    setNextPath(null)

    if (pathname === "/") {
      router.replace(redirectPath)
      return
    }

    router.push(redirectPath)
  }, [nextPath, pathname, router])

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
        isAuthDialogOpen,
        openAuthDialog,
        closeAuthDialog,
        refreshUser,
        signOut,
      }}
    >
      {children}
      <AuthDialog
        open={isAuthDialogOpen}
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
