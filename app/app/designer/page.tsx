import { redirect } from "next/navigation"

import { DesignerPageClient } from "./designer-page-client"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function DesignerPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/app")
  }

  return <DesignerPageClient />
}
