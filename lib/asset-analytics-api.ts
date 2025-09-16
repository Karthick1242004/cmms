import { apiClient } from './api';
import type { 
  AssetAnalyticsResponse, 
  AssetAnalyticsFilters,
  AnalyticsPreset 
} from '@/types/asset-analytics';

export const assetAnalyticsApi = {
  /**
   * Get asset analytics for a specific asset
   */
  getAssetAnalytics: async (
    assetId: string, 
    filters?: Partial<AssetAnalyticsFilters>
  ): Promise<AssetAnalyticsResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      if (filters?.period) {
        params.append('period', filters.period);
      }
      
      // Handle preset parameter
      const preset = (filters as any)?.preset as AnalyticsPreset;
      if (preset) {
        params.append('preset', preset);
      }

      const url = `/assets/${assetId}/analytics${params.toString() ? `?${params.toString()}` : ''}`;
      
      console.log('🚀 [Asset Analytics API] - GET request:', url);
      
      const result = await apiClient.get<AssetAnalyticsResponse>(url);
      
      console.log('📊 [Asset Analytics API] - Response success:', result.success);
      
      return result;
    } catch (error) {
      console.error('❌ [Asset Analytics API] - Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch asset analytics'
      };
    }
  }
};
