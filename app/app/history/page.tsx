"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, ExternalLink } from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { parseSubnetInputArray, type CalculationRecord } from "@/lib/history"
import { useAuth } from "@/components/core/auth-provider"

export default function HistoryPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { isAuthenticated, isAuthLoading } = useAuth()
  const [items, setItems] = useState<CalculationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!isAuthenticated) {
      return
    }

    let ignore = false

    async function loadHistory() {
      const { data, error: queryError } = await supabase
        .from("calculations")
        .select("id,title,base_network,base_cidr,input_subnets,total_required_hosts,total_usable_hosts,created_at")
        .order("created_at", { ascending: false })

      if (ignore) {
        return
      }

      if (queryError) {
        setError(queryError.message)
        setLoading(false)
        return
      }

      const parsedItems = ((data ?? []) as Partial<CalculationRecord>[]).map((item) => ({
        id: item.id ?? "",
        title: item.title ?? null,
        base_network: item.base_network ?? "",
        base_cidr: Number(item.base_cidr ?? 0),
        input_subnets: parseSubnetInputArray(item.input_subnets),
        result_subnets: [],
        total_required_hosts: Number(item.total_required_hosts ?? 0),
        total_usable_hosts: Number(item.total_usable_hosts ?? 0),
        created_at: item.created_at ?? new Date().toISOString(),
      }))

      setItems(parsedItems)
      setLoading(false)
    }

    void loadHistory()
    return () => {
      ignore = true
    }
  }, [isAuthenticated, isAuthLoading, supabase])

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Calculation History
            </CardTitle>
            <Badge variant="secondary">MVP</Badge>
          </CardHeader>
          <CardContent>
            {isAuthLoading ? (
              <p className="text-sm text-muted-foreground">Checking session...</p>
            ) : !isAuthenticated ? (
              <p className="text-sm text-muted-foreground">Sign in required to view calculation history.</p>
            ) : loading ? (
              <p className="text-sm text-muted-foreground">Loading history...</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved calculations yet.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.title ?? `${item.base_network}/${item.base_cidr}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.base_network}/{item.base_cidr} • {item.input_subnets?.length ?? 0} subnets
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button asChild size="sm" className="gap-1.5">
                        <Link href={`/app?history=${item.id}`}>
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
