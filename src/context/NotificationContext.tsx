import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { useNotifications as useNotificationsHook } from '@/hooks/use-notifications';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Notification } from '@/lib/firebase/firestore'; // Corrected import path

// Define a type for the data we want to send when adding a notification
interface AddNotificationData extends Omit<Notification, 'id' | 'timestamp' | 'read' | 'userId'> {
  userId: string;
  read?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (data: AddNotificationData) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotificationsHook(user?.uid);

  const addNotification = useCallback(async (data: AddNotificationData) => {
    if (!data.userId) {
        console.error("Cannot add notification without a user ID.");
        return;
    }

    try {
        const notificationsRef = collection(db, 'users', data.userId, 'notifications');
        await addDoc(notificationsRef, {
            ...data,
            read: data.read ?? false,
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
