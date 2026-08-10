"use client"

import { usePathname } from "next/navigation"
import { MiqalHeader } from "@/components/core/miqal-header"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAppRoute = pathname.startsWith("/app")

  return (
    <div className="min-h-svh">
      <MiqalHeader variant={isAppRoute ? "app" : "public"} />
      {children}
    </div>
  )
}
