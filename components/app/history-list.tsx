"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { History, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/core/auth-provider"
import type { CalculationRecord } from "@/lib/history"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type HistoryListProps = {
  items: CalculationRecord[]
  error?: string
}

export function HistoryList({ items, error }: HistoryListProps) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { user } = useAuth()
  const [records, setRecords] = useState(items)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setRecords(items)
  }, [items])

  const deleteCalculation = async (id: string) => {
    if (deletingId) {
      return
    }

    setDeletingId(id)

    if (!user) {
      toast.error("You must be signed in to delete calculations.")
      setDeletingId(null)
      return
    }

    const { data: deletedRows, error: deleteQueryError } = await supabase
      .from("calculations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")

    if (deleteQueryError) {
      toast.error(`Delete failed: ${deleteQueryError.message}`)
      setDeletingId(null)
      return
    }

    if (!deletedRows || deletedRows.length === 0) {
      toast.error("Delete failed: Calculation was not removed (permission or record mismatch).")
      setDeletingId(null)
      return
    }

    setRecords((current) => current.filter((item) => item.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Subnet History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved calculations yet.</p>
            ) : (
              <motion.div layout className="space-y-3">
                <AnimatePresence initial={false}>
                  {records.map((item) => {
                    const subnetCount =
                      item.result_subnets.length > 0 ? item.result_subnets.length : (item.input_subnets?.length ?? 0)

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="rounded-lg border border-border bg-secondary/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.title ?? `${item.base_network}/${item.base_cidr}`}</p>
                              <Badge variant={item.source_type === "ai_design" ? "secondary" : "outline"}>
                                {item.source_type === "ai_design" ? "AI design" : "Manual"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.base_network}/{item.base_cidr} • {subnetCount} subnets
                            </p>
                            {item.source_type === "ai_design" && item.ai_prompt ? (
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">Prompt: {item.ai_prompt}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => deleteCalculation(item.id)}
                              disabled={deletingId !== null}
                              aria-label="Delete calculation"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => router.push(`/app?history=${item.id}`)}
                            >
                              View plan
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
