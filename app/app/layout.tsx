"use client"

import { AppSidebar } from "@/components/core/app-sidebar"
import { NavBar } from "@/components/ui/nav-bar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="min-h-svh overflow-hidden">
          <NavBar />
          <motion.main
            key={pathname}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0.98 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.main>
        </SidebarInset>
      </SidebarProvider>
    </motion.div>
  )
}
