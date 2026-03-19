"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Calculator, Network } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"
import Link from "next/link"

export function HeroSection() {
  return (
    <motion.section
      className="relative overflow-hidden"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Practical subnet planning tool
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Subnet your networks{" "}
            <span className="text-primary">with precision</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Subnify helps you plan VLSM subnetting with clear calculations and visual network structure so you can allocate IP space with confidence.
          </motion.p>
          
          <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/app">
              <Button size="lg" className="gap-2">
                <Calculator className="h-4 w-4" />
                Start Calculating
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#calculator">
              <Button variant="outline" size="lg" className="gap-2">
                <Network className="h-4 w-4" />
                View Demo
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Highlights */}
        <motion.div variants={itemVariants} className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: "No signup", label: "Quick start" },
            { value: "Browser-based", label: "Works instantly" },
            { value: "CIDR + VLSM", label: "Built for planning" },
            { value: "Clear output", label: "Easy to share" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} className="text-center">
              <div className="text-lg font-bold text-primary sm:text-2xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
