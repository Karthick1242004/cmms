// Banner Types for Frontend

export interface BannerMessage {
  id: string;
  text: string;
  isActive: boolean;
  priority: number; // Higher number = higher priority, affects order
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BannerFormData {
  text: string;
  isActive: boolean;
  priority: number;
}

export interface BannerState {
  bannerMessages: BannerMessage[];
  isLoading: boolean;
  isDialogOpen: boolean;
  currentBanner: BannerMessage | null;
  
  // Actions
  fetchBannerMessages: () => Promise<void>;
  createBannerMessage: (data: BannerFormData) => Promise<void>;
  updateBannerMessage: (id: string, data: BannerFormData) => Promise<void>;
  deleteBannerMessage: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string, isActive: boolean) => Promise<void>;
  setDialogOpen: (open: boolean) => void;
  setEditBanner: (banner: BannerMessage | null) => void;
}
