import { create } from 'zustand';
import axios from 'axios';

export interface Promotion {
  id: string;
  code: string;
  title: string;
  discount_type: 'unit' | 'percentage';
  discount_value: number;
  product_id?: string;
  expires_at: string | null;
  status: string;
  target_type: 'all_users' | 'specific_user';
  assigned_user_id?: string;
}

interface PromotionStore {
  promotions: Promotion[];
  isLoading: boolean;
  error: string | null;
  fetchPromotions: () => Promise<void>;
  redeemPromotion: (code: string) => Promise<Promotion>;
}

export const usePromotionStore = create<PromotionStore>((set) => ({
  promotions: [],
  isLoading: false,
  error: null,

  fetchPromotions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/settings/promotions');
      set({ promotions: response.data.data, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  redeemPromotion: async (code: string) => {
    const response = await axios.post('/api/settings/promotions/redeem', { code });
    return response.data.data;
  },
}));
