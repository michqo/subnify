"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Network, Zap, Shield, Download, GitBranch, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

const features = [
  {
    icon: Calculator,
    title: "VLSM Calculator",
    description: "Allocate subnet blocks from host requirements using a proper largest-first strategy. No overlaps. No guesswork.",
  },
  {
    icon: Network,
    title: "Network Visualization",
    description: "See exactly how each subnet fits into the parent network with a clear visual map of your address space.",
  },
  {
    icon: Sparkles,
    title: "AI Designer",
    description: "Generate structured subnet plans from intent and constraints, then refine them instantly in the calculator.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "All calculations run instantly in your browser, so you can iterate quickly without workflow friction.",
  },
  {
    icon: Shield,
    title: "RFC-Compliant Output",
    description: "Work with standard CIDR notation and private address ranges based on RFC 1918.",
  },
  {
    icon: Download,
    title: "Export Ready",
    description: "Export subnet plans for documentation, handoff, or review.",
  },
  {
    icon: GitBranch,
    title: "Subnet Hierarchy",
    description: "Understand parent-child relationships across your allocations with a structured hierarchy view.",
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
            Plan IPv4 networks with a workflow built for real-world VLSM design — faster, clearer, and easier to validate.
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
