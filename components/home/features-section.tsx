"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Network, Zap, Shield, Download, GitBranch } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

const features = [
  {
    icon: Calculator,
    title: "VLSM Calculator",
    description: "Allocates subnets from host requirements using a VLSM-first flow.",
  },
  {
    icon: Network,
    title: "Network Visualization",
    description: "Displays how each block occupies the parent address space.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Runs calculations client-side for fast iteration while planning.",
  },
  {
    icon: Shield,
    title: "RFC Compliant",
    description: "Uses CIDR notation and RFC 1918 private addressing conventions.",
  },
  {
    icon: Download,
    title: "Export Options",
    description: "Exports calculation output for documentation and review workflows.",
  },
  {
    icon: GitBranch,
    title: "Subnet Hierarchy",
    description: "Shows parent-child relationships between generated subnet blocks.",
  },
]

export function FeaturesSection() {
  return (
    <motion.section
      id="features"
      className="border-t border-border bg-card/50 py-24 sm:py-32"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Features</h2>
          <p className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Focused subnet toolset
          </p>
          <p className="mt-4 text-pretty text-muted-foreground">
            Technical features for planning and validating IPv4 subnet layouts.
            Designed to integrate with future tools in the miqal portfolio.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="border-border bg-card transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
