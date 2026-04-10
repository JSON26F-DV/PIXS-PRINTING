import React, { useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import { NotificationContext } from './NotificationContextInstance';
import type { INotification } from '../types/notification';
import messagesData from '../data/messages.json';
import ordersData from '../data/order.json';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const lastCheckRef = useRef<Date | null>(null);

  const generateNotifications = useCallback(() => {
    const newNotifications: INotification[] = [];
    const lastCheck = lastCheckRef.current || new Date(0);

    // Generate Order Notifications directly from order.json
    (ordersData as unknown[]).forEach((o: unknown) => {
      const order = o as { status: string; created_at: string; order_id: string; products: unknown[] };
      const orderDate = new Date(order.created_at);
      
      if (order.status === 'DELIVERED') {
        if (orderDate > lastCheck) {
          newNotifications.push({
            id: `delivery-${order.order_id}`,
            type: 'order_update',
            title: `Order Delivered: ${order.order_id}`,
            description: `Your order has been officially delivered to your facility.`,
            timestamp: order.created_at,
            isRead: false,
            linkTo: '/order',
          });
        }
      } else if (order.status === 'PROCESSING') {
        if (orderDate > lastCheck) {
          newNotifications.push({
            id: `processing-${order.order_id}`,
            type: 'order_update',
            title: `Order Processing: ${order.order_id}`,
            description: `Your order is currently in production.`,
            timestamp: order.created_at,
            isRead: false,
            linkTo: '/order',
          });
        }
      }
    });

    (messagesData as unknown[]).forEach((m: unknown) => {
      interface MsgData {
        id: string;
        created_at?: string;
        timestamp?: string;
        sender_id?: string;
        sender?: string;
        message?: string;
        text?: string;
        senderName?: string;
      }
      const msg = m as MsgData;
      // Handle both old and new format for robustness
      const timestamp = msg.created_at || msg.timestamp || new Date().toISOString();
      const senderId = msg.sender_id || msg.sender;
      const messageText = msg.message || msg.text || "No Content";
      const senderName = msg.sender_id === 'CUST-501' ? 'Juan Dela Cruz' : (msg.senderName || 'PIXS Admin');

      const msgDate = new Date(timestamp);
      if (msgDate > lastCheck && senderId !== 'admin' && senderId !== 'EMP-001') {
        newNotifications.push({
          id: `message-${msg.id}`,
          type: 'message',
          title: `New Message from ${senderName}`,
          description: messageText.substring(0, 50) + '...',
          timestamp: timestamp,
          isRead: false,
          linkTo: '/messenger',
        });
      }
    });



    return newNotifications;
  }, []);

  const refreshNotifications = useCallback(() => {
    const newNotifs = generateNotifications();
    if (newNotifs.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
        return [...uniqueNew, ...prev].slice(0, 50);
      });
    }
    lastCheckRef.current = new Date();
  }, [generateNotifications]);

  useEffect(() => {
    if (!lastCheckRef.current) {
      lastCheckRef.current = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Initial fetch (async to avoid cascading render warning)
    setTimeout(() => refreshNotifications(), 0);
    
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
