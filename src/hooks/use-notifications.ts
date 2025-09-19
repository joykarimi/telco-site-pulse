
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/auth/AuthProvider';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    timestamp: string;
}

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const notificationsRef = collection(db, `users/${user.uid}/notifications`);
        const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const userNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
                setNotifications(userNotifications);
                setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching notifications: ", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!user) return;
        const notificationRef = doc(db, `users/${user.uid}/notifications`, notificationId);
        try {
            await updateDoc(notificationRef, { isRead: true });
        } catch (error) {
            console.error("Error updating notification: ", error);
        }
    }, [user]);

    return { notifications, markAsRead, isLoading };
};
