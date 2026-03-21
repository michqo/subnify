import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Settings page placeholder for upcoming user preferences.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
