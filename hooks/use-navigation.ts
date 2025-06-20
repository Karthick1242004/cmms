"use client"

import { useRouter, usePathname } from "next/navigation"
import { useTransition, useCallback, useEffect } from "react" // Added useEffect
import { useNavigationStore } from "@/stores/navigation-store"

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const {
    currentPath: storeCurrentPath,
    isLoading: storeIsLoading,
    loadingRoute: storeLoadingRoute,
    setCurrentPath,
    setLoading,
    setLoadingRoute,
    navigateWithLoading, 
  } = useNavigationStore()

  useEffect(() => {
    if (typeof navigateWithLoading !== "function") {
      console.error("useNavigation: navigateWithLoading is not a function from store!", useNavigationStore.getState())
    }
  }, [navigateWithLoading])

  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      if (href === pathname) return

      if (typeof navigateWithLoading === "function") {
        navigateWithLoading(href)
      } else {
        setLoadingRoute(href)
      }

      startTransition(() => {
        if (options?.replace) {
          router.replace(href)
        } else {
          router.push(href)
        }
        // The timeout helps ensure the transition completes and UI updates
        // before resetting loading states. Consider if this duration is optimal.
        // For faster perceived navigation, setCurrentPath could be called sooner,
        // but might lead to brief state inconsistencies if page load is slow.
        setTimeout(() => {
          setCurrentPath(href)
          // setLoadingRoute(null) and setLoading(false) are handled by setCurrentPath
        }, 300)
      })
    },
    [pathname, router, navigateWithLoading, setCurrentPath, setLoadingRoute, startTransition], 
  )

  const isRouteLoading = useCallback(
    (route: string) => {
      return storeLoadingRoute === route
    },
    [storeLoadingRoute],
  )

  return {
    navigate,
    currentPath: pathname,
    isLoading: isPending || storeIsLoading,
    isRouteLoading,
    loadingRoute: storeLoadingRoute,
  }
}
