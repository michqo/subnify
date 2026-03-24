"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Network, Zap, Shield, Download, GitBranch, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

const features = [
  {
    icon: Calculator,
    title: "VLSM Calculator",
    description: "Largest-first subnet allocation from host requirements.",
  },
  {
    icon: Network,
    title: "Network Visualization",
    description: "See how each subnet fits inside the parent network.",
  },
  {
    icon: Sparkles,
    title: "AI Designer",
    description: "Generate draft subnet plans from requirements and refine quickly.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Browser-based calculations with immediate feedback.",
  },
  {
    icon: Shield,
    title: "RFC-Compliant Output",
    description: "Standard CIDR output with RFC 1918 private ranges.",
  },
  {
    icon: Download,
    title: "Export Ready",
    description: "Export plans for handoff and documentation.",
  },
  {
    icon: GitBranch,
    title: "Subnet Hierarchy",
    description: "Clear parent-child view of your subnet allocation.",
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
            Focused subnet planning
          </p>
          <p className="mt-4 text-pretty text-muted-foreground">
            Practical tools for fast, clear IPv4 subnet planning.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants} className="h-full">
              <Card className="flex h-full flex-col border-border bg-card transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
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
