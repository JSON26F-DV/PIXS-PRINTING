import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface DiscoveryContextType {
  isDiscoveryOpen: boolean;
  initialCategory: string | null;
  openDiscovery: (category?: string | null) => void;
  closeDiscovery: () => void;
}

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

export const DiscoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string | null>(null);

  const openDiscovery = (category: string | null = null) => {
    setInitialCategory(category);
    setIsDiscoveryOpen(true);
  };

  const closeDiscovery = () => {
    setIsDiscoveryOpen(false);
    setInitialCategory(null);
  };

  return (
    <DiscoveryContext.Provider value={{ isDiscoveryOpen, initialCategory, openDiscovery, closeDiscovery }}>
      {children}
    </DiscoveryContext.Provider>
  );
};

export const useDiscovery = () => {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
};
