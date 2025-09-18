
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/auth/AuthProvider'; // Assuming AuthProvider gives user info

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  isRead: boolean;
  link?: string; // Optional link to navigate to
  metadata?: Record<string, any>; // Optional additional data
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  removeNotification: (id: string) => void;
  refreshNotifications: () => void; // Added for external refresh triggers
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get current user for potential user-specific notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load notifications from local storage on initial mount
  useEffect(() => {
    if (user) {
      const storedNotifications = localStorage.getItem(`notifications_${user.uid}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications).map((n: AppNotification) => ({
          ...n,
          timestamp: new Date(n.timestamp), // Convert timestamp string back to Date object
        })));
      }
    } else {
      setNotifications([]); // Clear notifications if no user
    }
  }, [user]);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Unique ID
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications((prev) => [newNotification, ...prev]); // Add new notification to the top
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  // This function can be called from other parts of the app to force a re-evaluation
  // For now, it just triggers a re-render of the notifications context if needed
  // In a real-world scenario, this might fetch new notifications from a backend
  const refreshNotifications = useCallback(() => {
    // For local storage based, a refresh might just re-read or trigger a new effect.
    // For a backend, this would initiate an API call to fetch fresh notifications.
    console.log("Refreshing notifications...");
    // If notifications were fetched from an API, you'd re-run that fetch here.
    // Since it's localStorage, simply updating state or triggering useEffect is enough.
    setNotifications([...notifications]); // Shallow copy to trigger re-render if needed
  }, [notifications]);


  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        removeNotification,
        refreshNotifications,
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
