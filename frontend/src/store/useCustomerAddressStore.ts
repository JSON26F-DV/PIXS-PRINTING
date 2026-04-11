import { create } from 'zustand';
import axios from 'axios';
import type { CustomerAddress } from '../pages/Settings/AddressBook/types';

interface CustomerAddressStore {
  addresses: CustomerAddress[];
  defaultAddressId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAddresses: () => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addAddress: (address: Omit<CustomerAddress, 'id' | 'is_default'>) => Promise<void>;
  updateAddress: (id: string, updated: Partial<CustomerAddress>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
}

export const useCustomerAddressStore = create<CustomerAddressStore>((set) => ({
  addresses: [],
  defaultAddressId: null,
  isLoading: false,
  error: null,

  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/settings/addresses');
      const data = response.data.data;
      set({ 
        addresses: data, 
        defaultAddressId: data.find((a: CustomerAddress) => a.is_default)?.id || null,
        isLoading: false 
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  
  setDefaultAddress: async (id) => {
    try {
      await axios.post(`/api/settings/addresses/${id}/default`);
      set((state) => ({
        defaultAddressId: id,
        addresses: state.addresses.map(a => ({
          ...a,
          is_default: a.id === id
        }))
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
    }
  },

  addAddress: async (address) => {
    try {
      const response = await axios.post('/api/settings/addresses', address);
      const newAddress = response.data.data;
      set((state) => ({
        addresses: [newAddress, ...state.addresses],
        defaultAddressId: newAddress.is_default ? newAddress.id : state.defaultAddressId
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateAddress: async (id, updated) => {
    try {
      const response = await axios.patch(`/api/settings/addresses/${id}`, updated);
      const updatedAddress = response.data.data;
      set((state) => ({
        addresses: state.addresses.map(a => a.id === id ? updatedAddress : a),
        defaultAddressId: updatedAddress.is_default ? updatedAddress.id : state.defaultAddressId
      }));
    } catch (err: unknown) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removeAddress: async (id) => {
    try {
      await axios.delete(`/api/settings/addresses/${id}`);
      set((state) => {
        const remaining = state.addresses.filter(a => a.id !== id);
        const newDefault = state.addresses.find(a => a.id === id)?.is_default 
          ? (remaining[0]?.id || null) 
          : state.defaultAddressId;
        
        return {
          addresses: remaining.map(a => ({ ...a, is_default: a.id === newDefault })),
          defaultAddressId: newDefault
        };
      });
    } catch (err: unknown) {
      set({ error: (err as Error).message });
      throw err;
    }
  }
}));