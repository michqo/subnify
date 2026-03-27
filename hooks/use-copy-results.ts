"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { VlsmAllocation } from "@/lib/vlsm"

export function useCopyResults() {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copyResults = useCallback((results: VlsmAllocation[]) => {
    const text = results
      .map(
        (result) =>
          `${result.name}: ${result.networkAddress}/${result.cidr} (Mask: ${result.subnetMask}, Range: ${result.firstHost} - ${result.lastHost})`
      )
      .join("\n")

    void navigator.clipboard.writeText(text)

    setCopied(true)

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false)
      timeoutRef.current = null
    }, 2000)
  }, [])

  return {
    copied,
    copyResults,
  }
}
