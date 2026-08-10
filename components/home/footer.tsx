import Link from "next/link"

export function Footer() {
  return <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span><span className="text-primary">/</span>miqal / subnify</span><nav className="flex flex-wrap gap-5"><Link href="/app" className="hover:text-foreground">Planner</Link><Link href="/app/help" className="hover:text-foreground">Help</Link><a href="https://github.com/michqo/subnify" className="hover:text-foreground">Source</a><a href="https://miqal.xyz" className="hover:text-foreground">Portfolio</a></nav></div></footer>
}
