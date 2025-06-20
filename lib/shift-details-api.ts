import { apiClient } from './api';
import type { ShiftDetail } from "@/types/shift-detail"

// API Response types
export interface ShiftDetailResponse {
  success: boolean
  data: ShiftDetail
  message: string
}

export interface ShiftDetailsListResponse {
  success: boolean
  data: {
    shiftDetails: ShiftDetail[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }
  message: string
}

export interface ShiftDetailStatsResponse {
  success: boolean
  data: {
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
    onLeaveEmployees: number
    dayShiftEmployees: number
    nightShiftEmployees: number
    rotatingShiftEmployees: number
    onCallEmployees: number
    departmentBreakdown: Array<{
      _id: string
      count: number
      activeCount: number
    }>
  }
  message: string
}

export interface ShiftDetailFilters {
  page?: number
  limit?: number
  search?: string
  department?: string
  shiftType?: string
  status?: string
  location?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Shift Details API functions
export const shiftDetailsApi = {
  // Get all shift details
  getAll: async (filters: ShiftDetailFilters = {}): Promise<ShiftDetailsListResponse> => {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/shift-details?${queryString}` : '/shift-details'

    return apiClient.get<ShiftDetailsListResponse>(endpoint)
  },

  // Get single shift detail by ID
  getById: async (id: number): Promise<ShiftDetailResponse> => {
    return apiClient.get<ShiftDetailResponse>(`/shift-details/${id}`)
  },

  // Create new shift detail
  create: async (shiftDetailData: Omit<ShiftDetail, 'id'>): Promise<ShiftDetailResponse> => {
    return apiClient.post<ShiftDetailResponse>('/shift-details', shiftDetailData)
  },

  // Update shift detail
  update: async (id: number, updates: Partial<ShiftDetail>): Promise<ShiftDetailResponse> => {
    return apiClient.put<ShiftDetailResponse>(`/shift-details/${id}`, updates)
  },

  // Delete shift detail
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/shift-details/${id}`)
  },

  // Get shift detail statistics
  getStats: async (): Promise<ShiftDetailStatsResponse> => {
    return apiClient.get<ShiftDetailStatsResponse>('/shift-details/stats')
  },
}

// Legacy class-based API for backward compatibility
export class ShiftDetailsAPI {
  static async getAllShiftDetails(filters: ShiftDetailFilters = {}): Promise<ShiftDetailsListResponse> {
    return shiftDetailsApi.getAll(filters)
  }

  static async getShiftDetailById(id: number): Promise<ShiftDetailResponse> {
    return shiftDetailsApi.getById(id)
  }

  static async createShiftDetail(shiftDetailData: Omit<ShiftDetail, 'id'>): Promise<ShiftDetailResponse> {
    return shiftDetailsApi.create(shiftDetailData)
  }

  static async updateShiftDetail(id: number, updates: Partial<ShiftDetail>): Promise<ShiftDetailResponse> {
    return shiftDetailsApi.update(id, updates)
  }

  static async deleteShiftDetail(id: number): Promise<{ success: boolean; message: string }> {
    return shiftDetailsApi.delete(id)
  }

  static async getShiftDetailStats(): Promise<ShiftDetailStatsResponse> {
    return shiftDetailsApi.getStats()
  }
} 