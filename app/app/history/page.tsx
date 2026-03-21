import { HistoryList } from "@/components/app/history-list"
import { parseSubnetInputArray, type CalculationRecord } from "@/lib/history"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <HistoryList items={[]} error="Sign in required to view calculation history." />
  }

  const { data, error } = await supabase
    .from("calculations")
    .select("id,title,base_network,base_cidr,input_subnets,total_required_hosts,total_usable_hosts,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return <HistoryList items={[]} error={error.message} />
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

  return <HistoryList items={parsedItems} />
}
