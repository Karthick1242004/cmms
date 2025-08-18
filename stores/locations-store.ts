import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Location, LocationsState } from "@/types/location";
import { locationsApi } from "@/lib/locations-api";

export const useLocationsStore = create<LocationsState>()(
  devtools(
    immer((set, get) => ({
      locations: [],
      filteredLocations: [],
      searchTerm: "",
      isLoading: false,
      isDialogOpen: false,
      selectedLocation: null,

      setLocations: (locations) =>
        set((state) => {
          state.locations = locations;
          state.filteredLocations = locations;
        }),

      addLocation: async (locationData) => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await locationsApi.create(locationData);
          if (response.success) {
            set((state) => {
              state.locations.push(response.data);
              get().filterLocations();
            });
          }
        } catch (error) {
          console.error('Error adding location:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      updateLocation: async (id, updates) => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await locationsApi.update(id, updates);
          if (response.success) {
            set((state) => {
              const index = state.locations.findIndex(location => location.id === id);
              if (index !== -1) {
                state.locations[index] = response.data;
              }
              get().filterLocations();
            });
          }
        } catch (error) {
          console.error('Error updating location:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      deleteLocation: async (id) => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await locationsApi.delete(id);
          if (response.success) {
            set((state) => {
              state.locations = state.locations.filter(location => location.id !== id);
              if (state.selectedLocation?.id === id) {
                state.selectedLocation = null;
              }
              get().filterLocations();
            });
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      setSearchTerm: (term) =>
        set((state) => {
          state.searchTerm = term;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setDialogOpen: (open) =>
        set((state) => {
          state.isDialogOpen = open;
        }),

      setSelectedLocation: (location) =>
        set((state) => {
          state.selectedLocation = location;
        }),

      filterLocations: () =>
        set((state) => {
          let filtered = [...state.locations];

          // Search filter
          if (state.searchTerm) {
            const searchLower = state.searchTerm.toLowerCase();
            filtered = filtered.filter(location =>
              location.name.toLowerCase().includes(searchLower) ||
              location.code.toLowerCase().includes(searchLower) ||
              location.type.toLowerCase().includes(searchLower) ||
              location.description.toLowerCase().includes(searchLower) ||
              location.department.toLowerCase().includes(searchLower) ||
              location.address.toLowerCase().includes(searchLower)
            );
          }

          state.filteredLocations = filtered;
        }),

      fetchLocations: async () => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await locationsApi.getAll();
          if (response.success) {
            set((state) => {
              state.locations = response.data.locations;
              state.filteredLocations = response.data.locations;
            });
            get().filterLocations();
          }
        } catch (error) {
          console.error('Error fetching locations:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },
    })),
    {
      name: "locations-store",
    }
  )
);
