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
import { LogOut, Bell, Settings } from 'lucide-react';

export function Header() {
  const { user, signOut, role } = useAuth();

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
    <header className="sticky top-0 backdrop-blur-lg bg-white/70 dark:bg-slate-800/70 shadow-lg z-10 px-6 py-3 flex justify-between items-center rounded-b-2xl">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 shadow-inner transition">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 shadow-inner transition">
          <Settings className="h-5 w-5" />
        </Button>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 shadow-md">
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
