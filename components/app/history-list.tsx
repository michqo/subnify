"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { History, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/core/auth-provider"
import {
  useCalculationsQuery,
  useDeleteCalculationMutation,
} from "@/lib/queries/calculations"
import { Skeleton } from "../ui/skeleton"

function HistoryLoading() {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  )
}

export function HistoryList() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const {
    data: records = [],
    isLoading,
    isError,
    error,
  } = useCalculationsQuery(userId)
  const {
    mutateAsync: deleteCalculation,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteCalculationMutation(userId)

  const handleDelete = async (id: string) => {
    if (isDeleting) {
      return
    }

    try {
      await deleteCalculation(id)
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Delete failed."
      toast.error(`Delete failed: ${message}`)
    }
  }

  const errorMessage = !user
    ? "Sign in required to view subnet history."
    : isError
      ? (error as Error).message
      : null

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
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : isLoading ? (
              <HistoryLoading />
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved calculations yet.
              </p>
            ) : (
              <motion.div layout className="space-y-3">
                <AnimatePresence initial={false}>
                  {records.map((item) => {
                    const subnetCount =
                      item.result_subnets.length > 0
                        ? item.result_subnets.length
                        : (item.input_subnets?.length ?? 0)

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
                              <p className="font-medium">
                                {item.title ??
                                  `${item.base_network}/${item.base_cidr}`}
                              </p>
                              <Badge
                                variant={
                                  item.source_type === "ai_design"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {item.source_type === "ai_design"
                                  ? "AI design"
                                  : "Manual"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.base_network}/{item.base_cidr} •{" "}
                              {subnetCount} subnets
                            </p>
                            {item.source_type === "ai_design" &&
                            item.ai_prompt ? (
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                Prompt: {item.ai_prompt}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              className="cursor-pointer"
                              variant="outline"
                              size="icon"
                              onClick={() => void handleDelete(item.id)}
                              disabled={isDeleting}
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
                              className="gap-1.5 cursor-pointer"
                              onClick={() =>
                                router.push(`/app?history=${item.id}`)
                              }
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
