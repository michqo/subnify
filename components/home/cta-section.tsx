import Link from "next/link"

import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
      <h2 className="text-3xl font-semibold tracking-tight">
        Start with 192.168.1.0/24.
      </h2>
      <Button asChild size="lg" className="mt-8">
        <Link href="/app">Open planner</Link>
      </Button>
    </section>
  )
}
