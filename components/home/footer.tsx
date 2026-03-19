"use client"

import Link from "next/link"
import { Network } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

const navigation = [
  { name: "Features", href: "#features" },
  { name: "Calculator", href: "#calculator" },
  { name: "Visualizer", href: "#visualizer" },
]

export function Footer() {
  return (
    <motion.footer
      className="border-t border-border bg-card/50"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <motion.div variants={itemVariants}>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Network className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Subnify</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Subnet planning and visualization in one place.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-6">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item.name}
              </Link>
            ))}
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Subnify.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  )
}
