import React, { useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import { NotificationContext } from './NotificationContextInstance';
import type { INotification, IComplaint, IMessage, IOrder } from '../types/notification';
import complaintsData from '../data/complaints.json';
import messagesData from '../data/messages.json';
import workflowData from '../data/workflow.json';


export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const lastCheckRef = useRef<Date | null>(null);

  const generateNotifications = useCallback(() => {
    const newNotifications: INotification[] = [];
    const lastCheck = lastCheckRef.current || new Date(0);

    (complaintsData as IComplaint[]).forEach((complaint) => {
      const complaintDate = new Date(complaint.date);
      if (complaintDate > lastCheck) {
        newNotifications.push({
          id: `complaint-${complaint.id}`,
          type: 'complaint',
          title: `New Complaint: ${complaint.issue_type}`,
          description: complaint.description.substring(0, 60) + '...',
          timestamp: complaint.date,
          isRead: false,
          linkTo: '/complaints',
          severity: (complaint.severity?.toLowerCase() || 'low') as 'low' | 'medium' | 'high',
        });
      }
    });

    (messagesData as unknown as IMessage[]).forEach((msg) => {

      const msgDate = new Date(msg.timestamp);
      if (msgDate > lastCheck && msg.sender !== 'admin') {
        newNotifications.push({
          id: `message-${msg.id}`,
          type: 'message',
          title: `New Message from ${msg.senderName}`,
          description: msg.text.substring(0, 50) + '...',
          timestamp: msg.timestamp,
          isRead: false,
          linkTo: '/messenger',
        });
      }
    });


    if (workflowData.productionQueue) {
      (workflowData.productionQueue as IOrder[]).forEach((order) => {
        if (order.status === 'ready_for_qc') {
          const approvedAt = new Date(order.approved_at);
          if (approvedAt > lastCheck) {
            newNotifications.push({
              id: `order-${order.id}`,
              type: 'order_update',
              title: `Order Ready for QC: ${order.id}`,
              description: `${order.product} for ${order.customer} is ready for quality check`,
              timestamp: order.approved_at,
              isRead: false,
              linkTo: '/workflow',
            });
          }
        }
      });
    }

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
