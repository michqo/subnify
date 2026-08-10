"use client"

import { Copy, Pencil, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAuth } from "@/components/core/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { CalculationRecord } from "@/lib/history"
import {
  useCalculationsQuery,
  useDeleteCalculationMutation,
  useDuplicateCalculationMutation,
  useRenameCalculationMutation,
} from "@/lib/queries/calculations"

type SourceFilter = "all" | "manual" | "ai_design"

export function HistoryList() {
  const router = useRouter()
  const { user, openAuthDialog } = useAuth()
  const userId = user?.id ?? null
  const { data: records = [], isLoading, isError, error, refetch } = useCalculationsQuery(userId)
  const deleteMutation = useDeleteCalculationMutation(userId)
  const renameMutation = useRenameCalculationMutation(userId)
  const duplicateMutation = useDuplicateCalculationMutation(userId)
  const [search, setSearch] = useState("")
  const [source, setSource] = useState<SourceFilter>("all")
  const [renaming, setRenaming] = useState<CalculationRecord | null>(null)
  const [renameTitle, setRenameTitle] = useState("")
  const [deleting, setDeleting] = useState<CalculationRecord | null>(null)

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return records.filter((record) => {
      const sourceMatches = source === "all" || record.source_type === source
      const textMatches = !needle || `${record.title ?? ""} ${record.base_network}/${record.base_cidr}`.toLocaleLowerCase().includes(needle)
      return sourceMatches && textMatches
    })
  }, [records, search, source])

  const perform = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      toast.success(success)
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : "Action failed.")
    }
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-6">
        <h1 className="font-mono text-xl font-semibold">Plan history</h1>
        <p className="mt-3 text-sm text-muted-foreground">Sign in to view plans saved to cloud history.</p>
        <Button className="mt-5" onClick={() => openAuthDialog("/app/history")}>Sign in</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 lg:px-6">
      <div><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">Cloud workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Plan history</h1></div>
      <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-[1fr_12rem]">
        <label className="relative"><span className="sr-only">Search plans</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search plans" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or network" className="pl-9" /></label>
        <label><span className="sr-only">Plan source</span><select aria-label="Plan source" value={source} onChange={(event) => setSource(event.target.value as SourceFilter)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="all">All sources</option><option value="manual">Manual</option><option value="ai_design">AI-generated</option></select></label>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading saved plans…</p> : null}
      {isError ? <div className="border-l-2 border-destructive pl-4"><p className="text-sm text-destructive">{(error as Error).message}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>Retry</Button></div> : null}
      {!isLoading && !isError && records.length === 0 ? <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No cloud plans yet. Save one from the planner.</p> : null}
      {!isLoading && !isError && records.length > 0 && filtered.length === 0 ? <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No plans match these filters.</p> : null}

      <div className="divide-y divide-border border-y border-border">
        {filtered.map((record) => {
          const title = record.title ?? `${record.base_network}/${record.base_cidr}`
          const count = record.result_subnets.length || record.input_subnets.length
          return (
            <article key={record.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-medium">{title}</h2><span className="font-mono text-[10px] uppercase tracking-wide text-primary">{record.source_type === "ai_design" ? "AI" : "Manual"}</span></div><p className="mt-1 font-mono text-xs text-muted-foreground">{record.base_network}/{record.base_cidr} · {count} subnets</p><p className="mt-1 text-xs text-muted-foreground">{new Date(record.created_at).toLocaleString()}</p></div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" aria-label={`Rename ${title}`} onClick={() => { setRenaming(record); setRenameTitle(title) }}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Duplicate ${title}`} onClick={() => void perform(() => duplicateMutation.mutateAsync(record), "Plan duplicated.")}><Copy className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${title}`} onClick={() => setDeleting(record)}><Trash2 className="size-4" /></Button>
                <Button size="sm" onClick={() => router.push(`/app?history=${record.id}`)}>Open plan</Button>
              </div>
            </article>
          )
        })}
      </div>

      <Dialog open={Boolean(renaming)} onOpenChange={(open) => !open && setRenaming(null)}><DialogContent className="rounded-md"><DialogHeader><DialogTitle>Rename plan</DialogTitle><DialogDescription>Use a short name you can recognize in history.</DialogDescription></DialogHeader><label className="space-y-2"><span className="text-sm font-medium">Plan title</span><Input aria-label="Plan title" value={renameTitle} maxLength={80} onChange={(event) => setRenameTitle(event.target.value)} /></label><DialogFooter><Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button><Button disabled={!renameTitle.trim() || renameMutation.isPending} onClick={() => { if (!renaming) return; void perform(() => renameMutation.mutateAsync({ calculationId: renaming.id, title: renameTitle.trim() }), "Plan renamed.").then(() => setRenaming(null)) }}>Save name</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent className="rounded-md"><DialogHeader><DialogTitle>Delete plan?</DialogTitle><DialogDescription>This removes the cloud copy. Exported files remain unchanged.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => { if (!deleting) return; void perform(() => deleteMutation.mutateAsync(deleting.id), "Plan deleted.").then(() => setDeleting(null)) }}>Confirm delete</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
