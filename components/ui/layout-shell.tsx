"use client"

import { usePathname } from "next/navigation"
import { NavBar } from "@/components/ui/nav-bar"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAppRoute = pathname.startsWith("/app")

  if (isAppRoute) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar />
      {children}
    </>
  )
}