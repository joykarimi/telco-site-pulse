import { Building2, Layers, Move, PieChart, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';

interface HeaderProps {
  sitesCount: number;
}

export function Header({ sitesCount }: HeaderProps) {
  const { profile, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrator',
      maintenance_manager: 'Maintenance Manager',
      operations_manager: 'Operations Manager',
      user: 'User',
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Telecom P&L Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor profit & loss across all telecommunication sites
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Navigation Links for New Features */}
        <div className="flex items-center gap-4 text-sm">
          <Link to="/assets" className="text-muted-foreground hover:text-primary">
            <Layers className="mr-1 h-4 w-4 inline" />
            Assets
          </Link>
          <Link to="/revenue-breakdown" className="text-muted-foreground hover:text-primary">
            <PieChart className="mr-1 h-4 w-4 inline" />
            Revenue Breakdown
          </Link>
          {(profile?.role === 'maintenance_manager' || profile?.role === 'operations_manager' || profile?.role === 'admin') && (
            <Link to="/asset-movement-requests" className="text-muted-foreground hover:text-primary">
              <Move className="mr-1 h-4 w-4 inline" />
              Asset Movements
            </Link>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300"></div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          {sitesCount} Sites Active
        </div>
        
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile.full_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getRoleLabel(profile.role)}
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
    </div>
  );
}