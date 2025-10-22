import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle, Mail, Clock, Trash2, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/NotificationContext";

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const renderNotificationMessage = (notification: any) => {
    if (notification.type === 'asset_movement_request' && notification.requestedByUserId && notification.requesterDisplayName) {
        // Construct a specific message for asset movement requests with requester name
        return `New asset movement request for ${notification.assetId || 'N/A'} from ${notification.fromSite || 'N/A'} to ${notification.toSite || 'N/A'} by ${notification.requesterDisplayName}.`;
    }
    // Fallback to the original message for other notification types or if requester info is missing
    return notification.message;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 rounded-full text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="text-md font-semibold">Notifications</h4>
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground p-4">No notifications yet.</p>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={`flex items-start gap-3 p-4 cursor-pointer relative ${notification.read ? 'bg-accent/5' : 'bg-accent/10 font-medium'} hover:bg-accent/20 transition-colors duration-200`}
                onClick={() => notification.link && (window.location.href = notification.link)} // Basic navigation
              >
                <div className="pt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <p className="text-sm leading-tight mb-0.5">{renderNotificationMessage(notification)}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</span>
                  </div>
                </div>
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                    title="Mark as read"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <DropdownMenuSeparator />
        )}
        <div className="flex justify-end p-2 gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" className="h-8 px-3 text-xs" onClick={markAllAsRead}>
              <CheckCircle className="h-3 w-3 mr-1"/> Mark all as read
            </Button>
          )}
          <Button variant="ghost" className="h-8 px-3 text-xs text-destructive hover:text-destructive/80" onClick={clearNotifications}>
            <Trash2 className="h-3 w-3 mr-1"/> Clear all
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
