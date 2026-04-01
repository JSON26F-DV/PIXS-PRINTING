import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import INITIAL_DATA from '../data/address_book.json';
import type { CustomerAddress } from '../pages/Settings/AddressBook/types';

interface CustomerAddressStore {
  addresses: CustomerAddress[];
  defaultAddressId: string | null;
  
  // Actions
  setAddresses: (addresses: CustomerAddress[]) => void;
  setDefaultAddress: (id: string) => void;
  addAddress: (address: CustomerAddress) => void;
  updateAddress: (id: string, updated: Partial<CustomerAddress>) => void;
  removeAddress: (id: string) => void;
}

export const useCustomerAddressStore = create<CustomerAddressStore>()(
  persist(
    (set) => ({
      addresses: INITIAL_DATA as CustomerAddress[],
      defaultAddressId: (INITIAL_DATA as CustomerAddress[]).find(a => a.is_default)?.id || null,

      setAddresses: (addresses) => set({ addresses }),
      
      setDefaultAddress: (id) => set((state) => ({
        defaultAddressId: id,
        addresses: state.addresses.map(a => ({
          ...a,
          is_default: a.id === id
        }))
      })),

      addAddress: (address) => set((state) => ({
        addresses: [address, ...state.addresses]
      })),

      updateAddress: (id, updated) => set((state) => ({
        addresses: state.addresses.map(a => a.id === id ? { ...a, ...updated } : a)
      })),

      removeAddress: (id) => set((state) => {
        const remaining = state.addresses.filter(a => a.id !== id);
        const newDefault = state.defaultAddressId === id ? (remaining[0]?.id || null) : state.defaultAddressId;
        return {
          addresses: remaining.map(a => ({ ...a, is_default: a.id === newDefault })),
          defaultAddressId: newDefault
        };
      })
    }),
    {
      name: 'pixs-customer-addresses',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
