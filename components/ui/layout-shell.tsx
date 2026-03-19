"use client"

import { usePathname } from "next/navigation"
import { NavBar } from "@/components/ui/nav-bar"
import { motion } from "framer-motion"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAppRoute = pathname.startsWith("/app")

  if (isAppRoute) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <>
      <NavBar />
      {children}
    </>
  )
}