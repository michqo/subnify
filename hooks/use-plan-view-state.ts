"use client"

import { useCallback, useEffect, useState } from "react"
import { type ReadonlyURLSearchParams, useRouter } from "next/navigation"

export type PlanView = "table" | "cards" | "visualizer"

function toPlanView(value: string | null): PlanView {
  if (value === "cards" || value === "visualizer") {
    return value
  }

  return "table"
}

export function usePlanViewState(searchParams: ReadonlyURLSearchParams) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<PlanView>("table")

  const buildAppUrl = useCallback((view?: PlanView) => {
    if (!view || view === "table") {
      return "/app"
    }

    return `/app?view=${view}`
  }, [])

  const resolveViewFromQuery = useCallback((): PlanView => {
    return toPlanView(searchParams.get("view"))
  }, [searchParams])

  useEffect(() => {
    setActiveView(resolveViewFromQuery())
  }, [resolveViewFromQuery])

  const handleViewChange = useCallback(
    (value: string) => {
      const nextView = toPlanView(value)
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
