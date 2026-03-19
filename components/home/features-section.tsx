"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Network, Zap, Shield, Download, GitBranch } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

const features = [
  {
    icon: Calculator,
    title: "VLSM Calculator",
    description: "Input your base network and required subnets. Get subnet masks and allocations based on host requirements.",
  },
  {
    icon: Network,
    title: "Network Visualization",
    description: "Interactive visual representation of your network topology. See how subnets relate to each other at a glance.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Results update directly in the interface as you work, without extra page reloads.",
  },
  {
    icon: Shield,
    title: "RFC Compliant",
    description: "Designed around RFC 1918 private addressing and CIDR subnetting conventions.",
  },
  {
    icon: Download,
    title: "Export Options",
    description: "Export your subnet calculations as CSV, JSON, or PDF. Share with your team or import into documentation.",
  },
  {
    icon: GitBranch,
    title: "Subnet Hierarchy",
    description: "Visualize parent-child subnet relationships. Understand how your address space is divided hierarchically.",
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
            Everything you need for subnet planning
          </p>
          <p className="mt-4 text-pretty text-muted-foreground">
            Professional-grade tools designed for network engineers, IT administrators, and students learning IP subnetting.
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
