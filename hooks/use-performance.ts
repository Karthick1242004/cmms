"use client"

import { useEffect, useRef } from "react"

export function usePerformance(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef<number>(0)

  useEffect(() => {
    renderCount.current += 1
    startTime.current = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime.current

      if (process.env.NODE_ENV === "development") {
        console.log(`${componentName} - Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
  }
}
