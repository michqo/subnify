import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function CTASection() {
  return <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">Ready when the network is</p><h2 className="mt-4 text-3xl font-semibold tracking-tight">Turn requirements into an address plan.</h2><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Manual planning stays free and immediate. Sign in only when you want cloud history or generated requirements.</p><Button asChild size="lg" className="mt-8"><Link href="/app">Start planning <ArrowRight className="size-4" /></Link></Button></section>
}
