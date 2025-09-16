
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, LogOut, Building2, Layers, PieChart, Move, ChevronDown } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer"

interface LayoutProps {
  children: React.ReactNode;
}

const SidebarContent: React.FC<any> = ({ getLinkClasses, getSubLinkClasses, toggleUserMenu, isUserMenuOpen, user, signOut }) => {
  const { role } = useAuth();
  const location = useLocation();

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <div className="flex items-center gap-2 p-4 border-b border-border mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-primary">Telco P&L</h1>
      </div>

      <nav className="flex flex-col gap-2 flex-grow px-4">
        <Link to="/" className={getLinkClasses("/", true)}>
          <Home className="h-5 w-5" />
          Dashboard
        </Link>
        <Link to="/assets" className={getLinkClasses("/assets")}>
          <Layers className="h-5 w-5" />
          Assets
        </Link>
        <Link to="/sites" className={getLinkClasses("/sites")}>
          <Building2 className="h-5 w-5" />
          Sites
        </Link>
        <Link to="/revenue-breakdown" className={getLinkClasses("/revenue-breakdown")}>
          <PieChart className="h-5 w-5" />
          Revenue Breakdown
        </Link>
        <Link to="/site-profitability" className={getLinkClasses("/site-profitability")}>
          <PieChart className="h-5 w-5" />
          Site Profitability
        </Link>
        {(role === 'maintenance_manager' || role === 'operations_manager' || role === 'admin') && (
          <Link to="/asset-movement-requests" className={getLinkClasses("/asset-movement-requests")}>
            <Move className="h-5 w-5" />
            Asset Movements
          </Link>
        )}

        {/* User Management Collapsible Menu */}
        <div className={location.pathname.startsWith('/admin') ? `bg-accent/5 rounded-lg` : ``}>
          <button onClick={toggleUserMenu} className={`flex items-center justify-between w-full ${getLinkClasses('/admin')}`}>
              <span className='flex items-center gap-3'>
                  <Users className="h-5 w-5" />
                  User Management
              </span>
              <motion.div animate={{ rotate: isUserMenuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="h-4 w-4" />
              </motion.div>
          </button>
          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex flex-col gap-1 pt-2"
              >
                <Link to="/admin/roles" className={getSubLinkClasses("/admin/roles")}>Roles</Link>
                <Link to="/admin/create-user" className={getSubLinkClasses("/admin/create-user")}>Create User</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to="/settings" className={getLinkClasses("/settings")}>
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </nav>

      {user && (
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {getInitials(user.displayName)}
                  </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm text-foreground truncate">{user.displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="ml-auto shrink-0 hover:bg-accent/10">
                <LogOut className="h-5 w-5" />
              </Button>
          </div>
        </div>
      )}
    </>
  )
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setUserMenuOpen] = useState(location.pathname.startsWith('/admin'));
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const getLinkClasses = (path: string, isExact: boolean = false) => {
    const base = "flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all duration-300";
    const isActive = isExact ? location.pathname === path : location.pathname.startsWith(path);

    if (isActive && !path.startsWith('/admin')) {
      return `${base} bg-accent/10 text-accent font-semibold`;
    }
    return base;
  };
  
  const getSubLinkClasses = (path: string) => {
    const base = "flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-all duration-300 text-sm";
    const isActive = location.pathname === path;

    if (isActive) {
      return `${base} bg-accent/10 text-accent font-semibold`;
    }
    return base;
  }

  const toggleUserMenu = () => setUserMenuOpen(!isUserMenuOpen);

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Drawer open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
          <DrawerContent className="w-64 h-full flex flex-col bg-card/50 backdrop-blur-sm">
            <SidebarContent 
              getLinkClasses={getLinkClasses}
              getSubLinkClasses={getSubLinkClasses}
              toggleUserMenu={toggleUserMenu}
              isUserMenuOpen={isUserMenuOpen}
              user={user}
              signOut={signOut}
            />
          </DrawerContent>
        </Drawer>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col shrink-0">
        <SidebarContent
          getLinkClasses={getLinkClasses}
          getSubLinkClasses={getSubLinkClasses}
          toggleUserMenu={toggleUserMenu}
          isUserMenuOpen={isUserMenuOpen}
          user={user}
          signOut={signOut}
        />
      </aside>

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
