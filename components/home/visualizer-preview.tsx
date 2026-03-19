"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

export function VisualizerPreview() {
  return (
    <motion.section
      id="visualizer"
      className="border-t border-border bg-card/50 py-24 sm:py-32"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Visualizer</h2>
          <p className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            See your network structure
          </p>
          <p className="mt-4 text-pretty text-muted-foreground">
            Interactive visualization helps you understand how your IP address space is divided across subnets.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mx-auto mt-16 max-w-5xl">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Network Topology</CardTitle>
              <CardDescription>Visual representation of subnet allocation within 192.168.1.0/24</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Address Space Bar */}
              <motion.div variants={itemVariants} className="space-y-3">
                <p className="text-sm font-medium">Address Space Utilization</p>
                <div className="relative h-12 w-full overflow-hidden rounded-lg border border-border bg-secondary/30">
                  <div
                    className="absolute left-0 top-0 flex h-full items-center justify-center border-r border-chart-1 bg-chart-1/30"
                    style={{ width: "25%" }}
                  >
                    <span className="text-xs font-medium">/26</span>
                  </div>
                  <div
                    className="absolute top-0 flex h-full items-center justify-center border-r border-chart-2 bg-chart-2/30"
                    style={{ left: "25%", width: "12.5%" }}
                  >
                    <span className="text-xs font-medium">/27</span>
                  </div>
                  <div
                    className="absolute top-0 flex h-full items-center justify-center border-r border-chart-3 bg-chart-3/30"
                    style={{ left: "37.5%", width: "6.25%" }}
                  >
                    <span className="text-xs font-medium">/28</span>
                  </div>
                  <div
                    className="absolute top-0 flex h-full items-center justify-center border-r border-chart-4 bg-chart-4/30"
                    style={{ left: "43.75%", width: "6.25%" }}
                  >
                    <span className="text-xs font-medium">/28</span>
                  </div>
                  <div
                    className="absolute top-0 flex h-full items-center justify-center bg-muted/30"
                    style={{ left: "50%", width: "50%" }}
                  >
                    <span className="text-xs text-muted-foreground">Unallocated</span>
                  </div>
                </div>
              </motion.div>

              {/* Subnet Tree */}
              <motion.div variants={itemVariants} className="space-y-3">
                <p className="text-sm font-medium">Subnet Hierarchy</p>
                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  {/* Root */}
                  <div className="flex items-center gap-3 rounded-md border border-primary/50 bg-primary/10 p-3">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <div>
                      <p className="font-mono text-sm font-medium">192.168.1.0/24</p>
                      <p className="text-xs text-muted-foreground">Main Network - 254 usable hosts</p>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="ml-6 mt-2 space-y-2 border-l border-border pl-6">
                    <div className="flex items-center gap-3 rounded-md border border-chart-1/50 bg-chart-1/10 p-3">
                      <div className="h-3 w-3 rounded-full bg-chart-1" />
                      <div>
                        <p className="font-mono text-sm font-medium">192.168.1.0/26</p>
                        <p className="text-xs text-muted-foreground">LAN A - 62 usable hosts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-chart-2/50 bg-chart-2/10 p-3">
                      <div className="h-3 w-3 rounded-full bg-chart-2" />
                      <div>
                        <p className="font-mono text-sm font-medium">192.168.1.64/27</p>
                        <p className="text-xs text-muted-foreground">LAN B - 30 usable hosts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-chart-3/50 bg-chart-3/10 p-3">
                      <div className="h-3 w-3 rounded-full bg-chart-3" />
                      <div>
                        <p className="font-mono text-sm font-medium">192.168.1.96/28</p>
                        <p className="text-xs text-muted-foreground">LAN C - 14 usable hosts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-chart-4/50 bg-chart-4/10 p-3">
                      <div className="h-3 w-3 rounded-full bg-chart-4" />
                      <div>
                        <p className="font-mono text-sm font-medium">192.168.1.112/28</p>
                        <p className="text-xs text-muted-foreground">LAN D - 14 usable hosts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Legend */}
              <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 rounded-lg bg-secondary/30 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-1" />
                  <span className="text-sm">LAN A</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-2" />
                  <span className="text-sm">LAN B</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-3" />
                  <span className="text-sm">LAN C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-4" />
                  <span className="text-sm">LAN D</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted" />
                  <span className="text-sm">Unallocated</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.section>
  )
}
