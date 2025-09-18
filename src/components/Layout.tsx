
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
    Home, Users, Settings, LogOut, Building2, Layers, PieChart, Move, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuth, usePermissions } from '@/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { PERMISSIONS } from "@/lib/roles";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from '@/components/ui/sidebar';
import alanDickLogo from '@/assets/images/alandick_logo.png';

interface LayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [isUserMenuOpen, setUserMenuOpen] = useState(location.pathname.startsWith('/admin'));
    const isMobile = useIsMobile();

    const getInitials = (name?: string | null) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const isActive = (path: string, isExact: boolean = false) => {
        return isExact ? location.pathname === path : location.pathname.startsWith(path);
    };

    const toggleUserMenu = () => setUserMenuOpen(!isUserMenuOpen);

    return (
        <SidebarProvider defaultOpen>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex flex-col items-center gap-2 p-4 border-b border-border mb-6">
                        <img src={alanDickLogo} alt="AlanDick Logo" className="h-12" />
                        <a href="https://www.alandick.co.ke" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground">alandick.co.ke</a>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/", true)}>
                                <Link to="/">
                                    <Home className="h-5 w-5" />
                                    Dashboard
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem permission={PERMISSIONS.ASSET_READ}>
                            <SidebarMenuButton asChild isActive={isActive("/assets")}>
                                <Link to="/assets">
                                    <Layers className="h-5 w-5" />
                                    Assets
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem permission={PERMISSIONS.SITE_READ}>
                            <SidebarMenuButton asChild isActive={isActive("/sites")}>
                                <Link to="/sites">
                                    <Building2 className="h-5 w-5" />
                                    Sites
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/revenue-breakdown")}>
                                <Link to="/revenue-breakdown">
                                    <PieChart className="h-5 w-5" />
                                    Revenue Breakdown
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/site-profitability")}>
                                <Link to="/site-profitability">
                                    <PieChart className="h-5 w-5" />
                                    Site Profitability
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem permission={PERMISSIONS.MOVEMENT_READ}>
                            <SidebarMenuButton asChild isActive={isActive("/asset-movement-requests")}>
                                <Link to="/asset-movement-requests">
                                    <Move className="h-5 w-5" />
                                    Asset Movements
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem permission={PERMISSIONS.USER_MANAGEMENT_READ}>
                            <SidebarMenuButton onClick={toggleUserMenu} isActive={isActive('/admin')}>
                                <Users className="h-5 w-5" />
                                User Management
                                <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-90' : ''}`} />
                            </SidebarMenuButton>
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <SidebarMenuSub>
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild isActive={isActive("/admin/roles")}>
                                                    <Link to="/admin/roles">Roles</Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarMenuSubItem permission={PERMISSIONS.USER_MANAGEMENT_CREATE}>
                                                <SidebarMenuSubButton asChild isActive={isActive("/admin/create-user")}>
                                                    <Link to="/admin/create-user">Create User</Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/settings")}>
                                <Link to="/settings">
                                    <Settings className="h-5 w-5" />
                                    Settings
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
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
                </SidebarFooter>
            </Sidebar>
            <main className="flex-1 flex flex-col">
                <Header />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
};

export default AppLayout;
