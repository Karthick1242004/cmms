import { create } from "zustand"
import { navigation as defaultNavigation } from "@/data/navigation"
import type { NavigationItem, NavigationState } from "@/types/navigation"
import type { CustomFeatureDefinition } from "@/types/custom-feature"

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPath: "/",
  isLoading: false,
  loadingRoute: null,
  breadcrumbs: [],
  customNavItems: [],
  defaultNavItems: defaultNavigation,

  setCurrentPath: (path) => set({ currentPath: path, loadingRoute: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingRoute: (route) => set({ loadingRoute: route, isLoading: true }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  navigateWithLoading: (href: string) => {
    set((state) => {
      if (state.currentPath === href) {
        return { isLoading: false, loadingRoute: null }
      }
      return { loadingRoute: href, isLoading: true }
    })
  },

  addCustomNavItem: (feature: CustomFeatureDefinition) => {
    const newNavItem: NavigationItem = {
      name: feature.name,
      href: `/custom/${feature.slug}`,
      iconName: feature.iconName || "LayoutGrid",
      isCustom: true,
    }
    set((state) => ({
      customNavItems: [...state.customNavItems, newNavItem],
    }))
  },

  getFullNavigation: () => {
    const { defaultNavItems, customNavItems } = get()
    const updatedNavItems = JSON.parse(JSON.stringify(defaultNavItems)) // Deep clone to avoid mutation issues

    if (customNavItems.length > 0) {
      const customFeaturesGroup: NavigationItem = {
        name: "Custom Modules", // Renamed for clarity
        href: "#", // Non-clickable parent
        iconName: "Puzzle", // Changed icon
        subItems: customNavItems.map((item) => ({
          name: item.name,
          href: item.href,
          iconName: item.iconName,
          isCustom: true,
        })),
      }

          const adminIndex = updatedNavItems.findIndex((item: NavigationItem) => item.name === "Admin")
    if (adminIndex !== -1 && updatedNavItems[adminIndex].subItems) {
      // Add "Custom Modules" as a sub-item of "Admin"
      const existingCustomModulesIndex = updatedNavItems[adminIndex].subItems!.findIndex(
        (sub: NavigationItem) => sub.name === "Custom Modules",
      )
              if (existingCustomModulesIndex !== -1) {
        updatedNavItems[adminIndex].subItems![existingCustomModulesIndex] = customFeaturesGroup
      } else {
        updatedNavItems[adminIndex].subItems!.push(customFeaturesGroup)
      }
    } else {
      // Fallback: add as a top-level item if Admin or its subItems don't exist
      const existingCustomGroupIndex = updatedNavItems.findIndex((item: NavigationItem) => item.name === "Custom Modules")
        if (existingCustomGroupIndex !== -1) {
          updatedNavItems[existingCustomGroupIndex] = customFeaturesGroup
        } else {
          updatedNavItems.push(customFeaturesGroup)
        }
      }
    }
    return updatedNavItems
  },
}))
