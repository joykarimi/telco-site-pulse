
import React from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/context/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotificationDropdown: React.FC = () => {
    const { notifications, unreadCount, isLoading, markAllAsRead } = useNotifications();

    const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 5);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 shadow-2xl border-0 rounded-xl">
                <div className="p-3 flex items-center justify-between border-b">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); markAllAsRead(); }} className="text-primary hover:bg-primary/10">
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                ) : unreadCount === 0 ? (
                    <div className="py-12 px-6 text-center">
                        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">All caught up</h3>
                        <p className="mt-1 text-sm text-muted-foreground">You have no new notifications.</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto py-2">
                        {unreadNotifications.map(notification => (
                            <Link key={notification.id} to={notification.link || '#'}>
                                <DropdownMenuItem className="flex items-start p-3 gap-3 whitespace-normal cursor-pointer transition-colors hover:bg-muted/80">
                                    <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-snug">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            </Link>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />

                <div className="p-2">
                    <Link to="/notifications">
                        <Button variant="outline" className="w-full text-primary border-primary/50 hover:bg-primary/10 hover:text-primary">
                            View All Notifications
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default React.memo(NotificationDropdown);
