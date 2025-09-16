import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../auth/AuthProvider';
import { LogOut, Bell, Settings, Menu } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';
import { useIsMobile } from '@/hooks/use-mobile';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, signOut, role } = useAuth();
  const isMobile = useIsMobile();

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    const labels = {
      admin: 'Administrator',
      maintenance_manager: 'Maintenance Manager',
      operations_manager: 'Operations Manager',
      viewer: 'Viewer',
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/50 px-6 backdrop-blur-sm">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="-ml-2"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}
      <h2 className="text-lg font-semibold text-foreground">
        Dashboard
      </h2>

      <div className="flex flex-1 items-center gap-4 justify-end">
        <ModeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
           <span className="sr-only">Settings</span>
        </Button>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getRoleLabel(role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}