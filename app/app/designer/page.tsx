import { redirect } from "next/navigation"

export default function DesignerPage() {
  redirect("/app?generate=1")
}
