import React, { useState } from 'react';
import { Bell, X, Check, Eye } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';

export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    removeNotification 
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const getNotificationClass = (notificationType: string) => {
    switch (notificationType) {
      case 'info': return 'text-blue-500 bg-blue-500/10';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10';
      case 'success': return 'text-green-500 bg-green-500/10';
      case 'error': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-2">
          Notifications
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllNotificationsAsRead} className="h-auto p-0 text-xs">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">No new notifications</p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={`flex items-start gap-2 py-3 pr-2 pl-4 cursor-pointer relative 
                            ${!notification.isRead ? 'bg-accent/20 hover:bg-accent/30' : 'hover:bg-accent/10'}
                          `}
                onClick={() => {
                  if (!notification.isRead) {
                    markNotificationAsRead(notification.id);
                  }
                  if (notification.link) {
                    // Programmatic navigation for SPA or full page reload
                    // For simplicity, using Link for now, but direct navigation possible
                  }
                }}
              >
                {!notification.isRead && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                )}
                <div className="flex-1 flex flex-col pt-0.5">
                  <p className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.timestamp.toLocaleString()}
                  </p>
                  {notification.link && (
                    <Link 
                      to={notification.link} 
                      className="text-xs text-blue-500 hover:underline mt-1"
                      onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                    >
                      View Details
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1">
                    {!notification.isRead && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notification.id); }}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <DropdownMenuSeparator />
        )}
        {notifications.length > 0 && (
            <DropdownMenuItem className="py-2 px-4 flex justify-center">
                <Button variant="link" size="sm" onClick={removeNotification} className="h-auto p-0 text-xs text-destructive">
                    Clear all
                </Button>
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
