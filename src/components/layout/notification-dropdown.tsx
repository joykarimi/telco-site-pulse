
import React, { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications'; // Assuming you have this hook

const NotificationDropdown: React.FC = () => {
    const { notifications, markAsRead, isLoading } = useNotifications();

    const unreadNotifications = useMemo(() => 
        notifications.filter(n => !n.isRead), 
        [notifications]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative rounded-full p-2 hover:bg-gray-200">
                    <Bell className="h-6 w-6 text-gray-600" />
                    {unreadNotifications.length > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {unreadNotifications.length}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 font-bold border-b">Notifications</div>
                {isLoading ? (
                    <div className="p-4 text-center">Loading...</div>
                ) : unreadNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No new notifications</div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {unreadNotifications.map(notification => (
                            <DropdownMenuItem key={notification.id} onSelect={() => markAsRead(notification.id)} className="flex flex-col items-start p-2 hover:bg-gray-100 cursor-pointer">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-sm text-gray-600">{notification.message}</p>
                                <p className="text-xs text-gray-400 self-end">{new Date(notification.timestamp).toLocaleDateString()}</p>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default React.memo(NotificationDropdown);
