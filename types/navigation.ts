export interface NavigationItem {
  name: string
  href: string
  iconName: string
  subItems?: NavigationItem[]
  isCustom?: boolean
}

export interface NavigationState {
  currentPath: string
  isLoading: boolean
  loadingRoute: string | null
  breadcrumbs: Array<{ label: string; href: string }>
  customNavItems: NavigationItem[]
  defaultNavItems: NavigationItem[]

  // Actions
  setCurrentPath: (path: string) => void
  setLoading: (loading: boolean) => void
  setLoadingRoute: (route: string | null) => void
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href: string }>) => void
  navigateWithLoading: (route: string) => void
  addCustomNavItem: (feature: any) => void
  getFullNavigation: () => NavigationItem[]
}
