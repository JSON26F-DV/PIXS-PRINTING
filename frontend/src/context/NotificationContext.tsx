import React, {
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react'
import { NotificationContext } from './NotificationContextInstance'
import type { INotification } from '../types/notification'
import axiosInstance from '../lib/axiosInstance.ts'
import { useAuth } from './AuthContext'

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<INotification[]>([])
  const { user } = useAuth()

  const isLoggedIn = Boolean(user?.isLoggedIn)

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn) return
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
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return

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
  }, [isLoggedIn, refreshNotifications])

  // Derive effective notifications — if user is logged out, always return empty
  // This avoids calling setNotifications([]) inside an effect on logout
  const effectiveNotifications = isLoggedIn ? notifications : []
  const unreadCount = effectiveNotifications.filter((n) => !n.isRead).length

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
        notifications: effectiveNotifications,
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
