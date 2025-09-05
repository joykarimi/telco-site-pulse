import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, LogOut, Building2, Layers, PieChart, Move, ChevronDown } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut, role } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setUserMenuOpen] = useState(location.pathname.startsWith('/admin'));

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getLinkClasses = (path: string, isExact: boolean = false) => {
    const base = "flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700/60 hover:text-white hover:shadow-md transition-all duration-300";
    const isActive = isExact ? location.pathname === path : location.pathname.startsWith(path);

    // Do not apply active style to the User Management button itself, only to its children
    if (isActive && !path.startsWith('/admin')) {
      return `${base} bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg font-semibold`;
    }
    return base;
  };
  
  const getSubLinkClasses = (path: string) => {
    const base = "flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-700/60 hover:text-white transition-all duration-300 text-sm";
    const isActive = location.pathname === path;

    if (isActive) {
      return `${base} bg-slate-700/80 text-white font-semibold`;
    }
    return base;
  }

  const toggleUserMenu = () => setUserMenuOpen(!isUserMenuOpen);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl rounded-r-2xl p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-2 p-4 border-b border-slate-700/50 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Telco P&L</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
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
          {(role === 'maintenance_manager' || role === 'operations_manager' || role === 'admin') && (
            <Link to="/asset-movement-requests" className={getLinkClasses("/asset-movement-requests")}>
              <Move className="h-5 w-5" />
              Asset Movements
            </Link>
          )}

          {/* User Management Collapsible Menu */}
          <div className={location.pathname.startsWith('/admin') ? `bg-slate-700/20 rounded-xl` : ``}>
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
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                        {getInitials(user.displayName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm text-slate-100 truncate">{user.displayName}</span>
                    <span className="text-xs text-slate-400 truncate">{user.email}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => signOut()} className="ml-auto shrink-0 hover:bg-slate-700/60">
                  <LogOut className="h-5 w-5" />
                </Button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
