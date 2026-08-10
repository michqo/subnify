export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] flex-col">{children}</main>
  )
}
