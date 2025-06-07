"use client"

import { useRouter, usePathname } from "next/navigation"
import { useTransition, useCallback, useEffect } from "react" // Added useEffect
import { useNavigationStore } from "@/stores/navigation-store"

export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Destructure all needed functions and state from the store
  const {
    currentPath: storeCurrentPath, // Renamed to avoid conflict with pathname
    isLoading: storeIsLoading,
    loadingRoute: storeLoadingRoute,
    setCurrentPath,
    setLoading,
    setLoadingRoute,
    navigateWithLoading, // This is the function from the store
  } = useNavigationStore()

  // Debug: Log if navigateWithLoading is undefined
  useEffect(() => {
    if (typeof navigateWithLoading !== "function") {
      console.error("useNavigation: navigateWithLoading is not a function from store!", useNavigationStore.getState())
    }
  }, [navigateWithLoading])

  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      if (href === pathname) return

      // Call the store's function to update loading state
      if (typeof navigateWithLoading === "function") {
        navigateWithLoading(href)
      } else {
        // Fallback if function is not available, though this indicates a deeper issue
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
    [pathname, router, navigateWithLoading, setCurrentPath, setLoadingRoute, startTransition], // Added startTransition
  )

  const isRouteLoading = useCallback(
    (route: string) => {
      // Use storeLoadingRoute and storeIsLoading for consistency
      return storeLoadingRoute === route || (isPending && storeCurrentPath !== route)
    },
    [storeLoadingRoute, isPending, storeCurrentPath],
  )

  return {
    navigate,
    currentPath: pathname, // Use live pathname for currentPath
    isLoading: isPending || storeIsLoading, // Combine transition pending with store loading
    isRouteLoading,
    loadingRoute: storeLoadingRoute,
  }
}
