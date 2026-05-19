import { create } from 'zustand'
import axiosInstance from '../lib/axiosInstance.ts'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  timestamp: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>,
  ) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
}

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const { data } = await axiosInstance.get('/api/notifications')
      const formatted = data.data.map((n: ApiNotification) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        timestamp: n.created_at,
      }))
      set({
        notifications: formatted,
        unreadCount: formatted.filter((item: Notification) => !item.isRead).length,
      })
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  },
  addNotification: (n) =>
    set((state) => {
      const next = {
        ...n,
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        isRead: false,
      }
      const updated = [next, ...state.notifications]
      return {
        notifications: updated,
        unreadCount: updated.filter((item) => !item.isRead).length,
      }
    }),
  markAsRead: async (id) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`)
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        )
        return {
          notifications: updated,
          unreadCount: updated.filter((item) => !item.isRead).length,
        }
      })
    } catch (error) {
      console.error('Failed to mark as read', error)
    }
  },
  markAllAsRead: async () => {
    try {
      await axiosInstance.patch('/api/notifications/read-all')
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }))
    } catch (e) {
      console.error(e)
    }
  },
  clearNotification: async (id) => {
    try {
      await axiosInstance.delete(`/api/notifications/${id}`)
      set((state) => {
        const updated = state.notifications.filter((n) => n.id !== id)
        return {
          notifications: updated,
          unreadCount: updated.filter((item) => !item.isRead).length,
        }
      })
    } catch (e) {
      console.error(e)
    }
  },
  clearAllNotifications: async () => {
    try {
      await axiosInstance.delete('/api/notifications/clear-all')
      set({ notifications: [], unreadCount: 0 })
    } catch (e) {
      console.error(e)
    }
  },
}))
