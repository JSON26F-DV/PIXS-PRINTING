import { useEffect, useState } from 'react';
import axiosInstance from '../lib/axiosInstance';

export interface DeliveryMethod {
  id: string;
  name: string;
}

export const useDeliveryMethods = () => {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace fetch with API call -> axios.get('/api/delivery-methods') - using axiosInstance
    axiosInstance.get('/api/delivery-methods')
      .then(response => {
        setMethods(response.data);
      })
      .catch(error => {
        console.error('Failed to fetch delivery methods', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { methods, isLoading };
};
