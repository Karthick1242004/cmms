export interface NavigationItem {
  name: string
  href: string
  iconName: string
  subItems?: NavigationItem[]
}

export interface NavigationState {
  currentPath: string
  isLoading: boolean
  loadingRoute: string | null
  breadcrumbs: Array<{ label: string; href: string }>

  // Actions
  setCurrentPath: (path: string) => void
  setLoading: (loading: boolean) => void
  setLoadingRoute: (route: string | null) => void
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string }>) => void
  navigateWithLoading: (route: string) => void
}
