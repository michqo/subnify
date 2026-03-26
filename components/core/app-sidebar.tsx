"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Network,
  GitBranch,
  Sparkles,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronsUpDown,
  LogIn,
} from "lucide-react"
import { useAuth } from "@/components/core/auth-provider"

const navigation = [
  { name: "Planner", href: "/app", icon: GitBranch },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const { user, isAuthenticated, openAuthDialog, signOut } = useAuth()
  // Derive display name directly from user metadata instead of storing in state
  const computedDisplayName = user?.user_metadata?.display_name || null
  const collapsed = state === "collapsed"
  const accountLabel = (computedDisplayName || user?.email) ?? "Guest"
  const accountInitials = (computedDisplayName || user?.email)?.[0]?.toUpperCase() ?? "G"

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const items = isAuthenticated ? [...navigation, { name: "Designer", href: "/app/designer", icon: Sparkles }, { name: "Subnet History", href: "/app/history", icon: History }] : navigation

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 justify-center gap-0 border-b border-sidebar-border px-2 py-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Network className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
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
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} onClick={handleNavClick}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-2 rounded-md px-1.5 py-1.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {accountInitials}
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{isAuthenticated ? "Signed in" : "Guest"}</p>
                    <p className="truncate text-xs text-muted-foreground">{accountLabel}</p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/settings" onClick={handleNavClick}>
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/help" onClick={handleNavClick}>
                <HelpCircle className="h-4 w-4" />
                Help
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isAuthenticated ? (
              <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => openAuthDialog(pathname)}>
                <LogIn className="h-4 w-4" />
                Sign in
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
