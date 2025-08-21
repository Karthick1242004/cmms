import { useCallback } from 'react';
import { toast } from 'sonner';

export function useLocationAssetCounts() {
  // Function to silently update asset counts in the background
  const updateAssetCounts = useCallback(async (showToast = false) => {
    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch('/api/locations/update-asset-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        if (showToast) {
          toast.success('Asset counts updated successfully!');
        }
        return true;
      } else {
        if (showToast) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          toast.error(errorData.message || 'Failed to update asset counts');
        }
        return false;
      }
    } catch (error) {
      console.error('Error updating asset counts:', error);
      if (showToast) {
        toast.error('Failed to update asset counts');
      }
      return false;
    }
  }, []);

  return {
    updateAssetCounts
  };
}
