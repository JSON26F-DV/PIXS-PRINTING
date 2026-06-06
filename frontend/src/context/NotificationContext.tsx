import React, {
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react'
import { NotificationContext } from './NotificationContextInstance'
import type { INotification } from '../types/notification'
import axiosInstance from '../lib/axiosInstance.ts'

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<INotification[]>([])

  const refreshNotifications = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/notifications')
      const formatted: INotification[] = (data.data || []).map((n: {
        id: string
        type?: 'message' | 'complaint' | 'low_stock' | 'order_update'
        title: string
        message: string
        created_at?: string
        is_read: boolean | number
        link_to?: string
        severity?: 'low' | 'medium' | 'high'
      }) => ({
        id: n.id,
        type: n.type || 'order_update',
        title: n.title,
        description: n.message,
        timestamp: n.created_at || new Date().toISOString(),
        isRead: !!n.is_read,
        linkTo: n.link_to || '/order',
        severity: n.severity || 'low',
      }))
      setNotifications(formatted)
    } catch (error) {
      console.error('Failed to fetch notifications in context', error)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshNotifications()
    }, 0)

    const interval = setInterval(() => {
      refreshNotifications()
    }, 15000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [refreshNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/api/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      )
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch('/api/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
