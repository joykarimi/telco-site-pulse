
import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import { Notification } from '@/types/notification';

export const useNotifications = (userId: string | undefined) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) {
            setNotifications([]);
            setUnreadCount(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedNotifications: Notification[] = [];
            let unread = 0;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const notification: Notification = {
                    id: doc.id,
                    message: data.message,
                    type: data.type,
                    link: data.link,
                    isRead: data.isRead,
                    timestamp: data.timestamp.toDate().toISOString(),
                };
                fetchedNotifications.push(notification);
                if (!notification.isRead) {
                    unread++;
                }
            });
            setNotifications(fetchedNotifications);
            setUnreadCount(unread);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!userId) return;
        try {
            const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
            const batch = writeBatch(db);
            batch.update(notificationRef, { isRead: true });
            await batch.commit();
        } catch (error) {
            console.error("Error marking notification as read: ", error);
        }
    }, [userId]);
    
    const markAllAsRead = useCallback(async () => {
        if (!userId || unreadCount === 0) return;
    
        const unreadNotifications = notifications.filter(n => !n.isRead);
    
        try {
          const batch = writeBatch(db);
          unreadNotifications.forEach(notification => {
            const notificationRef = doc(db, 'users', userId, 'notifications', notification.id);
            batch.update(notificationRef, { isRead: true });
          });
          await batch.commit();
        } catch (error) {
          console.error("Error marking all notifications as read: ", error);
        }
    }, [userId, notifications, unreadCount]);

    return { notifications, isLoading, unreadCount, markAsRead, markAllAsRead };
};
