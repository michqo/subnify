export type PlanView = "table" | "visualizer" | "hierarchy"

export function parsePlanView(value: string | null): PlanView {
  return value === "visualizer" || value === "hierarchy" ? value : "table"
}

export function buildPlanViewUrl(view: PlanView = "table"): string {
  return view === "table" ? "/app" : `/app?view=${view}`
}
