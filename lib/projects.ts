import { Cloud, Moon, Network, Utensils, type LucideIcon } from "lucide-react"

export type Project = {
  name: string
  href: string
  description: string
  icon: LucideIcon
}

export const PROJECT_LIST: Project[] = [
  {
    name: "Weather Station",
    href: "https://ms.miqal.xyz",
    description: "IoT monitoring dashboard",
    icon: Cloud,
  },
  {
    name: "Subnify",
    href: "https://subnify.miqal.xyz",
    description: "IPv4 subnet planner",
    icon: Network,
  },
  {
    name: "Sleep Cycle",
    href: "https://www.sleep.miqal.xyz",
    description: "Sleep schedule calculator",
    icon: Moon,
  },
  {
    name: "Obedy",
    href: "https://obedy.miqal.xyz",
    description: "Menu obedov v okolí Nív",
    icon: Utensils,
  },
]
