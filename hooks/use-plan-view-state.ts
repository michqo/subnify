"use client"

import { useCallback, useEffect, useState } from "react"
import { type ReadonlyURLSearchParams, useRouter } from "next/navigation"
import { buildPlanViewUrl, parsePlanView, type PlanView } from "@/lib/plan-view"

export type { PlanView } from "@/lib/plan-view"

export function usePlanViewState(searchParams: ReadonlyURLSearchParams) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<PlanView>("table")

  const buildAppUrl = useCallback((view?: PlanView) => {
    if (!view || view === "table") {
      return buildPlanViewUrl("table")
    }

    return buildPlanViewUrl(view)
  }, [])

  const resolveViewFromQuery = useCallback((): PlanView => {
    return parsePlanView(searchParams.get("view"))
  }, [searchParams])

  useEffect(() => {
    setActiveView(resolveViewFromQuery())
  }, [resolveViewFromQuery])

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = parsePlanView(value)
      setActiveView(nextView)
      router.replace(buildAppUrl(nextView), { scroll: false })
    },
    [buildAppUrl, router]
  )

  const replaceToCurrentView = useCallback(() => {
    router.replace(buildAppUrl(resolveViewFromQuery()), { scroll: false })
  }, [router, buildAppUrl, resolveViewFromQuery])

  return {
    activeView,
    buildAppUrl,
    resolveViewFromQuery,
    handleViewChange,
    replaceToCurrentView,
  }
}
