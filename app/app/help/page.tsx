import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HelpPage() {
  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Help</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Help page placeholder for documentation and usage guides.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
