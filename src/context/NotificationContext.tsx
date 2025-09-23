
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { useNotifications as useNotificationsHook } from '@/hooks/use-notifications';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Notification } from '@/types/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (message: string, type: Notification['type'], link: string, userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotificationsHook(user?.uid);

  const addNotification = useCallback(async (message: string, type: Notification['type'], link: string, userId: string) => {
    if (!userId) {
        console.error("Cannot add notification without a user ID.");
        return;
    }

    try {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        await addDoc(notificationsRef, {
            message,
            type,
            link,
            isRead: false,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding notification to Firestore: ", error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
