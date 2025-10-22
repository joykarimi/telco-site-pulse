import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import { Notification, getUserProfile } from '@/lib/firebase/firestore'; // Import getUserProfile

interface NotificationWithRequesterName extends Notification {
    requesterDisplayName?: string;
}

export const useNotifications = (userId: string | undefined) => {
    const [notifications, setNotifications] = useState<NotificationWithRequesterName[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    // New state to cache requester display names
    const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});

    // Function to fetch and cache requester's display name
    const fetchRequesterName = useCallback(async (requesterId: string) => {
        if (!requesterNames[requesterId]) {
            const profile = await getUserProfile(requesterId);
            if (profile?.displayName) {
                setRequesterNames(prevNames => ({ ...prevNames, [requesterId]: profile.displayName }));
                return profile.displayName;
            }
        }
        return requesterNames[requesterId]; // Return from cache if available
    }, [requesterNames]);

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

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const fetchedNotifications: NotificationWithRequesterName[] = [];
            let unread = 0;
            const uniqueRequesterIds = new Set<string>();

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const notification: NotificationWithRequesterName = {
                    id: doc.id,
                    userId: userId, 
                    message: data.message,
                    type: data.type,
                    link: data.link || undefined, 
                    read: data.read, 
                    timestamp: data.timestamp.toDate(), 
                    requestedByUserId: data.requestedByUserId || undefined, // Get the new field
                };
                fetchedNotifications.push(notification);
                if (!notification.read) {
                    unread++;
                }
                if (notification.requestedByUserId) {
                    uniqueRequesterIds.add(notification.requestedByUserId);
                }
            });

            // Fetch display names for all unique requesters
            const namePromises = Array.from(uniqueRequesterIds).map(async (reqId) => {
                if (!requesterNames[reqId]) { // Only fetch if not already in cache
                    return fetchRequesterName(reqId);
                } else {
                    return requesterNames[reqId];
                }
            });
            await Promise.all(namePromises);

            // Update notifications with resolved requester names
            const notificationsWithNames = fetchedNotifications.map(n => ({
                ...n,
                requesterDisplayName: n.requestedByUserId ? requesterNames[n.requestedByUserId] || 'Unknown User' : undefined,
            }));

            setNotifications(notificationsWithNames);
            setUnreadCount(unread);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching notifications: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, fetchRequesterName, requesterNames]); // Add requesterNames to dependencies

    const markAsRead = useCallback(async (notificationId: string) => {
        if (!userId) return;
        try {
            const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
            const batch = writeBatch(db);
            batch.update(notificationRef, { read: true }); 
            await batch.commit();
        } catch (error) {
            console.error("Error marking notification as read: ", error);
        }
    }, [userId]);
    
    const markAllAsRead = useCallback(async () => {
        if (!userId || unreadCount === 0) return;
    
        const unreadNotifications = notifications.filter(n => !n.read); 
    
        try {
          const batch = writeBatch(db);
          unreadNotifications.forEach(notification => {
            const notificationRef = doc(db, 'users', userId, 'notifications', notification.id);
            batch.update(notificationRef, { read: true }); 
          });
          await batch.commit();
        } catch (error) {
          console.error("Error marking all notifications as read: ", error);
        }
    }, [userId, notifications, unreadCount]);

    return { notifications, isLoading, unreadCount, markAsRead, markAllAsRead };
};
