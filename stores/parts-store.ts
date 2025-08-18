import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Part, PartsState } from "@/types/part";
import { partsApi } from "@/lib/parts-api";

export const usePartsStore = create<PartsState>()(
  devtools(
    immer((set, get) => ({
      parts: [],
      filteredParts: [],
      searchTerm: "",
      categoryFilter: "all",
      departmentFilter: "all",
      isLoading: false,
      isDialogOpen: false,
      selectedPart: null,

      setParts: (parts) =>
        set((state) => {
          state.parts = parts;
          state.filteredParts = parts;
        }),

      addPart: async (partData) => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await partsApi.create(partData);
          if (response.success) {
            set((state) => {
              state.parts.push(response.data);
              get().filterParts();
            });
          }
        } catch (error) {
          console.error('Error adding part:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      updatePart: async (id, updates) => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await partsApi.update(id, updates);
          if (response.success) {
            set((state) => {
              const index = state.parts.findIndex(part => part.id === id);
              if (index !== -1) {
                state.parts[index] = response.data;
              }
              get().filterParts();
            });
          }
        } catch (error) {
          console.error('Error updating part:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      deletePart: async (id) => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await partsApi.delete(id);
          if (response.success) {
            set((state) => {
              state.parts = state.parts.filter(part => part.id !== id);
              if (state.selectedPart?.id === id) {
                state.selectedPart = null;
              }
              get().filterParts();
            });
          }
        } catch (error) {
          console.error('Error deleting part:', error);
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

      setCategoryFilter: (category) =>
        set((state) => {
          state.categoryFilter = category;
        }),

      setDepartmentFilter: (department) =>
        set((state) => {
          state.departmentFilter = department;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setDialogOpen: (open) =>
        set((state) => {
          state.isDialogOpen = open;
        }),

      setSelectedPart: (part) =>
        set((state) => {
          state.selectedPart = part;
        }),

      filterParts: () =>
        set((state) => {
          let filtered = [...state.parts];

          // Search filter
          if (state.searchTerm) {
            const searchLower = state.searchTerm.toLowerCase();
            filtered = filtered.filter(part =>
              part.name.toLowerCase().includes(searchLower) ||
              part.partNumber.toLowerCase().includes(searchLower) ||
              part.sku.toLowerCase().includes(searchLower) ||
              part.materialCode.toLowerCase().includes(searchLower) ||
              part.supplier.toLowerCase().includes(searchLower) ||
              part.description?.toLowerCase().includes(searchLower)
            );
          }

          // Category filter
          if (state.categoryFilter && state.categoryFilter !== "all") {
            filtered = filtered.filter(part => part.category === state.categoryFilter);
          }

          // Department filter
          if (state.departmentFilter && state.departmentFilter !== "all") {
            filtered = filtered.filter(part => 
              part.department === state.departmentFilter ||
              part.departmentsServed?.includes(state.departmentFilter)
            );
          }

          state.filteredParts = filtered;
        }),

      fetchParts: async () => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const response = await partsApi.getAll();
          if (response.success) {
            set((state) => {
              state.parts = response.data.parts;
              state.filteredParts = response.data.parts;
            });
            get().filterParts();
          }
        } catch (error) {
          console.error('Error fetching parts:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },
    })),
    {
      name: "parts-store",
    }
  )
);
