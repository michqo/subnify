"use client"

import { useAuth } from "@/components/core/auth-provider"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { CircleUserRound, LogOut, Menu, Network, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { SidebarTrigger } from "./sidebar"

const FLOAT_IN = 80
const FLOAT_OUT = 40
const EASE = { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as const

export function NavBar() {
  const pathname = usePathname()
  const isAppRoute = pathname.startsWith("/app")
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openAuthDialog, isAuthenticated, isAuthLoading, signOut, user } = useAuth()

  const appHeader = {
    title: pathname.startsWith("/app/visualizer")
      ? "Network Visualizer"
      : pathname.startsWith("/app/history")
        ? "Calculation History"
        : pathname.startsWith("/app/settings")
          ? "Settings"
          : pathname.startsWith("/app/help")
            ? "Help"
            : "Subnet Calculator",
    description: pathname.startsWith("/app/visualizer")
      ? "Visualize address space allocation"
      : pathname.startsWith("/app/history")
        ? "Review previous subnet calculations"
        : pathname.startsWith("/app/settings")
          ? "Manage your preferences"
          : pathname.startsWith("/app/help")
            ? "Get help using Subnify"
            : "Create and review variable length subnet plans",
  }

  useEffect(() => {
    if (isAppRoute) {
      return
    }

    const update = () => {
      const y = window.scrollY
      setScrolled((prev) => {
        if (!prev && y > FLOAT_IN) return true
        if (prev && y < FLOAT_OUT) return false
        return prev
      })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [isAppRoute])

  if (isAppRoute) {
    return (
      <motion.div
        className="sticky top-0 z-50 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <header className="w-full border-b border-border/50 bg-background/95 backdrop-blur-md">
          <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold sm:text-lg">{appHeader.title}</h1>
                <p className="hidden truncate text-sm text-muted-foreground lg:block">{appHeader.description}</p>
              </div>
            </div>

            <div className="hidden sm:block" />
          </div>
        </header>
      </motion.div>
    )
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <motion.div
        initial={{ opacity: 0, y: -12, maxWidth: "100%", paddingLeft: 0, paddingRight: 0, paddingTop: 0 }}
        animate={{
          opacity: 1,
          y: 0,
          maxWidth: scrolled ? 900 : 10000,
          paddingLeft: scrolled ? 16 : 0,
          paddingRight: scrolled ? 16 : 0,
          paddingTop: scrolled ? 8 : 0,
        }}
        transition={{
          opacity: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
          y: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
          maxWidth: EASE,
          paddingLeft: EASE,
          paddingRight: EASE,
          paddingTop: EASE,
        }}
        style={{ width: "100%" }}
        className="mx-auto"
      >
        <motion.header
          animate={{ borderRadius: scrolled ? 12 : 0 }}
          transition={EASE}
          className={cn(
            "border-border/50 bg-background/80 backdrop-blur-md transition-[box-shadow,border] duration-500",
            scrolled ? "border shadow-lg shadow-black/8 dark:shadow-black/20" : "border-b"
          )}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Network className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <a
                  href="https://miqal.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  miqal
                </a>
                <span className="text-muted-foreground">/</span>
                <Link href="/" className="transition-colors hover:text-primary">
                  subnify
                </Link>
              </div>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Features
              </Link>
              <Link
                href="#calculator"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Calculator
              </Link>
              <Link
                href="#visualizer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Visualizer
              </Link>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {isAuthLoading ? (
                <Button variant="ghost" size="sm" disabled>
                  Loading...
                </Button>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open user menu">
                      <CircleUserRound className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-56">
                    <DropdownMenuLabel className="truncate">{(user?.user_metadata?.display_name || user?.email) ?? "Signed in"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => openAuthDialog("/app")}>
                  Sign In
                </Button>
              )}
              <Button size="sm" asChild>
                <Link href="/app">Get Started</Link>
              </Button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-border bg-background px-4 py-4 md:hidden">
              <nav className="flex flex-col gap-4">
                <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                  Features
                </Link>
                <Link href="#calculator" className="text-sm text-muted-foreground hover:text-foreground">
                  Calculator
                </Link>
                <Link href="#visualizer" className="text-sm text-muted-foreground hover:text-foreground">
                  Visualizer
                </Link>
                <div className="flex flex-col gap-2 pt-4">
                  {isAuthLoading ? (
                    <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
                      Loading...
                    </Button>
                  ) : isAuthenticated ? (
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => openAuthDialog("/app")}
                    >
                      Sign In
                    </Button>
                  )}
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/app">Get Started</Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </motion.header>
      </motion.div>
    </div>
  )
}
