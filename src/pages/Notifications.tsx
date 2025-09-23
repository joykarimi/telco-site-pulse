
import { useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { useNotifications } from '@/hooks/use-notifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BellIcon, CheckCircle2, MailWarning } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const notificationIcons = {
    info: <BellIcon className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <BellIcon className="h-5 w-5 text-red-500" />,
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const { notifications, isLoading, markAllAsRead } = useNotifications(user?.uid);

    useEffect(() => {
        // Automatically mark all notifications as read when the page is viewed.
        if (notifications.some(n => !n.isRead)) {
            markAllAsRead();
        }
    }, [notifications, markAllAsRead]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
            </div>
            <Card className="shadow-lg border-0">
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>A complete log of all your notifications, from important alerts to gentle reminders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <MailWarning className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">You're all caught up!</h3>
                            <p className="mt-2 text-base text-muted-foreground">
                                You have no new notifications. When you do, they will appear here.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border -mx-6">
                            {notifications.map((notification) => (
                                <li key={notification.id}>
                                    <Link to={notification.link || '#'} className={cn(
                                        "block p-6 transition-colors group",
                                        !notification.isRead && "bg-primary/5",
                                        notification.link && "hover:bg-muted/50"
                                    )}>
                                        <div className="flex items-start space-x-4">
                                            <span className={cn(
                                                "h-2 w-2 rounded-full mt-2.5",
                                                !notification.isRead ? "bg-primary" : "bg-transparent"
                                            )}></span>
                                            <Avatar className={cn(
                                                "h-10 w-10 transition-transform duration-300 group-hover:scale-110",
                                                !notification.isRead ? "bg-primary/10" : "bg-muted"
                                                )}>
                                                <AvatarFallback>
                                                    {notificationIcons[notification.type] || <BellIcon className="h-5 w-5" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-base font-medium leading-tight">
                                                    {notification.message}
                                                </p>
                                                <p className="text-sm text-muted-foreground" title={format(new Date(notification.timestamp), 'PPP p')}>
                                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
