"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

export function CTASection() {
  return (
    <motion.section
      className="border-t border-border py-24 sm:py-32"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-16">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[32px_32px]" />
          
          <div className="relative mx-auto max-w-2xl text-center">
            <motion.h2 variants={itemVariants} className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Start a subnet
              <span className="text-primary"> planning session</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
              Use Subnify to draft and review CIDR/VLSM allocations directly in the browser.
            </motion.p>
            <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2">
                Open Calculator
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
