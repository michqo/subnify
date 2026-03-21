import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { LayoutShell } from "@/components/ui/layout-shell";
import { AuthProvider } from "@/components/core/auth-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://miqal.xyz"),
  title: {
    default: "miqal / subnify",
    template: "%s | miqal / subnify",
  },
  description:
    "Subnify is a VLSM subnet calculator and network planning tool in the miqal ecosystem of connected apps.",
  applicationName: "Subnify",
  keywords: [
    "Subnify",
    "miqal",
    "VLSM calculator",
    "subnet calculator",
    "CIDR planning",
    "network visualizer",
    "network engineering",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "miqal / subnify",
    description:
      "Plan and visualize subnet allocations with Subnify, part of the miqal ecosystem of connected tools.",
    url: "https://miqal.xyz",
    siteName: "miqal / subnify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "miqal / subnify",
    description:
      "VLSM subnet planning and visualization, integrated into the miqal app ecosystem.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
