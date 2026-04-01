import { createContext } from 'react';
import type { INotification } from '../types/notification';

export interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
