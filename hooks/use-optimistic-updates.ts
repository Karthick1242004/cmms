"use client"

import { useCallback, useState } from "react"

export function useOptimisticUpdates<T>() {
  const [optimisticData, setOptimisticData] = useState<T[]>([])

  const addOptimistic = useCallback((item: T) => {
    setOptimisticData((prev) => [...prev, item])
  }, [])

  const removeOptimistic = useCallback((predicate: (item: T) => boolean) => {
    setOptimisticData((prev) => prev.filter((item) => !predicate(item)))
  }, [])

  const clearOptimistic = useCallback(() => {
    setOptimisticData([])
  }, [])

  return {
    optimisticData,
    addOptimistic,
    removeOptimistic,
    clearOptimistic,
  }
}
