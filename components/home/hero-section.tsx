"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calculator, Network } from "lucide-react"
import { motion, type Variants } from "framer-motion"
import { itemVariants } from "./motion"
import Link from "next/link"

const HERO_EASE = [0.25, 0.1, 0.25, 1] as const

const heroSectionVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: HERO_EASE,
      staggerChildren: 0.06,
    },
  },
}

export function HeroSection() {
  return (
    <motion.section
      className="relative overflow-hidden"
      variants={heroSectionVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            CIDR and VLSM subnet tooling
            <Badge variant="outline" className="ml-1">Alpha</Badge>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Calculate subnet allocations{" "}
            <span className="bg-linear-to-r from-primary to-cyan-700 bg-clip-text text-transparent">with precision</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Define a base network, set host requirements, and inspect generated subnet ranges and hierarchy.
          </motion.p>
          
          <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/app">
              <Button size="lg" className="gap-2 cursor-pointer">
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
            { value: "CIDR + VLSM", label: "Calculation model" },
            { value: "Subnet masks", label: "Derived per block" },
            { value: "Host ranges", label: "Usable boundaries" },
            { value: "Hierarchy view", label: "Allocation context" },
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
