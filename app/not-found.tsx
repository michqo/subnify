import Link from "next/link"
import { GitBranch, Network, SearchX, Server } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center overflow-auto p-4 lg:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card className="border-border">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Network className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Subnify Route Monitor</span>
            </div>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <SearchX className="h-5 w-5 text-primary" />
              Route Not Found (404)
            </CardTitle>
            <CardDescription>
              The requested endpoint does not exist in the current network map. You can return to the calculator or
              home route.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <GitBranch className="h-4 w-4 text-primary" />
                Path Resolution Trace
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Tip: Check the URL path or open one of the known app routes.
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/app">Open Calculator</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
