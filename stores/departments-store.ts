import { create } from "zustand"
import type { Department } from "@/types/department"

interface DepartmentsState {
  departments: Department[]
  filteredDepartments: Department[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  editingDepartment: Department | null
  fetchDepartments: () => Promise<void>
  addDepartment: (
    department: Omit<Department, "id" | "employeeCount" | "status"> &
      Partial<Pick<Department, "employeeCount" | "status">>,
  ) => Promise<void>
  updateDepartment: (id: string, updates: Partial<Omit<Department, "id">>) => Promise<void>
  deleteDepartment: (id: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setDialogOpen: (open: boolean) => void
  setEditingDepartment: (department: Department | null) => void
}

// API base URL - will use Next.js API routes which proxy to the server
const API_BASE_URL = '/api/departments';
const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000/api/departments';

export const useDepartmentsStore = create<DepartmentsState>((set, get) => ({
  departments: [],
  filteredDepartments: [],
  searchTerm: "",
  isLoading: true,
  isDialogOpen: false,
  editingDepartment: null,

  fetchDepartments: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch(SERVER_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const result = await response.json();
      const departments = result.data?.departments || [];
      
      set({ 
        departments, 
        filteredDepartments: departments, 
        isLoading: false 
      });
      
      // Apply current search filter if any
      const { searchTerm } = get();
      if (searchTerm) {
        get().setSearchTerm(searchTerm);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      set({ isLoading: false });
      // You might want to show a toast or notification here
    }
  },

  addDepartment: async (departmentData) => {
    try {
      const response = await fetch(SERVER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...departmentData,
          employeeCount: departmentData.employeeCount || 0,
          status: departmentData.status || 'active'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create department');
      }

      const result = await response.json();
      const newDepartment = result.data;

      set((state) => {
        const updatedDepartments = [...state.departments, newDepartment];
        return {
          departments: updatedDepartments,
          filteredDepartments: updatedDepartments.filter(
            (dep) =>
              dep.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              dep.description.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              dep.manager.toLowerCase().includes(state.searchTerm.toLowerCase()),
          ),
        };
      });
    } catch (error) {
      console.error('Error creating department:', error);
      throw error; // Re-throw to let the component handle the error
    }
  },

  updateDepartment: async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update department');
      }

      const result = await response.json();
      const updatedDepartment = result.data;

      set((state) => {
        const updatedDepartments = state.departments.map((dep) => 
          dep.id === id ? updatedDepartment : dep
        );
        return {
          departments: updatedDepartments,
          filteredDepartments: updatedDepartments.filter(
            (dep) =>
              dep.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              dep.description.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              dep.manager.toLowerCase().includes(state.searchTerm.toLowerCase()),
          ),
        };
      });
    } catch (error) {
      console.error('Error updating department:', error);
      throw error; // Re-throw to let the component handle the error
    }
  },

  deleteDepartment: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }

      set((state) => {
        const updatedDepartments = state.departments.filter((dep) => dep.id !== id);
        return {
          departments: updatedDepartments,
          filteredDepartments: updatedDepartments.filter(
            (dep) =>
              dep.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              dep.description.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
              dep.manager.toLowerCase().includes(state.searchTerm.toLowerCase()),
          ),
        };
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error; // Re-throw to let the component handle the error
    }
  },

  setSearchTerm: (term) => {
    set((state) => ({
      searchTerm: term,
      filteredDepartments: state.departments.filter(
        (dep) =>
          dep.name.toLowerCase().includes(term.toLowerCase()) ||
          dep.description.toLowerCase().includes(term.toLowerCase()) ||
          dep.manager.toLowerCase().includes(term.toLowerCase()),
      ),
    }))
  },

  setDialogOpen: (open) => set({ isDialogOpen: open }),
  setEditingDepartment: (department) => set({ editingDepartment: department, isDialogOpen: !!department }),
}))
