"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CircleUserRound, Github, LayoutGrid, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

import { useAuth } from "@/components/core/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PROJECT_LIST } from "@/lib/projects"
import { cn } from "@/lib/utils"

const appLinks = [
  { label: "Planner", href: "/app" },
  { label: "History", href: "/app/history" },
  { label: "Help", href: "/app/help" },
]

const publicLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Planner", href: "/app" },
]

export function MiqalHeader({ variant }: { variant: "public" | "app" }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, isAuthLoading, openAuthDialog, signOut, user } = useAuth()
  const links = variant === "app" ? appLinks : publicLinks

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-7">
          <div className="flex shrink-0 items-center font-mono text-sm font-bold tracking-tight">
            <Link href="https://miqal.xyz" aria-label="Miqal home" className="group">
              <span className="text-primary transition-colors group-hover:text-primary/70">/</span>
              <span>miqal</span>
            </Link>
            <span className="px-1.5 text-muted-foreground">/</span>
            <Link href="/" aria-label="Subnify home" className="font-medium text-muted-foreground transition-colors hover:text-foreground">
              subnify
            </Link>
          </div>

          <nav aria-label="Product navigation" className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = link.href.startsWith("/") && pathname === link.href
              return (
                <Button key={link.href} asChild variant="ghost" size="sm">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("font-mono text-xs", active && "bg-accent text-accent-foreground")}
                  >
                    {link.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Miqal apps">
                <LayoutGrid className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5">
              <DropdownMenuLabel className="font-mono text-xs">Miqal apps</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROJECT_LIST.map(({ name, href, description, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <a href={href} className="flex items-center gap-3 px-3 py-2.5">
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{description}</span>
                    </span>
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="outline" size="icon">
            <a href="https://github.com/michqo/subnify" target="_blank" rel="noreferrer" aria-label="Source code">
              <Github className="size-4" />
            </a>
          </Button>
          <ThemeToggle />

          {variant === "app" ? (
            isAuthLoading ? (
              <Button variant="outline" size="sm" disabled>Loading</Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Account menu">
                    <CircleUserRound className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="truncate">
                    {(user?.user_metadata?.display_name || user?.email) ?? "Signed in"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/app/settings">Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => openAuthDialog(pathname)}>Sign in</Button>
            )
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/app">Open planner</Link></Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Product menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <nav aria-label="Mobile product navigation" className="border-t border-border/70 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-1">
            {links.map((link) => (
              <Button key={link.href} asChild variant="ghost" className="justify-start font-mono text-xs">
                <Link href={link.href} onClick={() => setMobileOpen(false)}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
