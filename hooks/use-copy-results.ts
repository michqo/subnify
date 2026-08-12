"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { VlsmCalculationSuccess } from "@/lib/vlsm"

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

  const copyResults = useCallback((calculation: VlsmCalculationSuccess) => {
    const text = calculation.allocations
      .map(
        (result) =>
          `${result.name}: ${result.networkAddress}/${result.cidr} (Mask: ${result.subnetMask}, Range: ${result.firstHost} - ${result.lastHost})`
      )
      .join("\n")

    const write = navigator.clipboard.writeText(text)

    setCopied(true)

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false)
      timeoutRef.current = null
    }, 2000)

    return write
  }, [])

  return {
    copied,
    copyResults,
  }
}
