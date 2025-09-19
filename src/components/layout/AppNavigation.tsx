
import React from 'react';
import { Link } from 'react-router-dom';
import {
    Home, Users, Settings, Building2, Layers, PieChart, Move, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERMISSIONS } from "@/lib/roles";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from '@/components/ui/sidebar';

interface AppNavigationProps {
    isActive: (path: string, isExact?: boolean) => boolean;
    isUserMenuOpen: boolean;
    toggleUserMenu: () => void;
}

const AppNavigation: React.FC<AppNavigationProps> = ({ isActive, isUserMenuOpen, toggleUserMenu }) => {
    return (
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
    );
};

export default React.memo(AppNavigation);
