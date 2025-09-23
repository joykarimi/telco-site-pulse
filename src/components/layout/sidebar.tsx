
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  ChevronLeft,
  Menu,
  Home,
  Building2,
  Layers,
  PieChart,
  Move,
  ChevronRight,
  LogOut,
  MoreHorizontal,
} from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { PERMISSIONS } from "@/lib/roles"
import { useAuth } from "@/auth/AuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"

interface SidebarProps {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  isCollapsed: boolean
  permission?: string
  submenu?: NavItemProps[]
}

interface CollapsibleNavItemProps extends NavItemProps {
  isOpen: boolean
  toggle: () => void
}

const navItems: (NavItemProps | (NavItemProps & { submenu: NavItemProps[] }))[] = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/assets", icon: Layers, label: "Assets", permission: PERMISSIONS.ASSET_READ },
  { href: "/sites", icon: Building2, label: "Sites", permission: PERMISSIONS.SITE_READ },
  { href: "/revenue-breakdown", icon: PieChart, label: "Revenue Breakdown" },
  { href: "/site-profitability", icon: PieChart, label: "Site Profitability" },
  { href: "/asset-movement-requests", icon: Move, label: "Asset Movements", permission: PERMISSIONS.MOVEMENT_READ },
  {
    href: "/admin",
    icon: Users,
    label: "User Management",
    permission: PERMISSIONS.USER_MANAGEMENT_READ,
    submenu: [
      { href: "/admin/roles", icon: Users, label: "Roles" },
      { href: "/admin/create-user", icon: Users, label: "Create User", permission: PERMISSIONS.USER_MANAGEMENT_CREATE },
    ],
  },
];

const getInitials = (name?: string | null) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, isCollapsed }) => {
  const { pathname } = useLocation()
  const isActive = pathname === href
  const { theme } = useTheme()

  return (
    <Link to={href}>
      <motion.div
        className={cn(
          "flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors text-sm",
          theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-200/50",
          isActive && (theme === "dark" ? "bg-primary/10 shadow-inner text-primary" : "bg-primary/10 shadow-inner text-primary")
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : theme === "dark" ? "text-gray-400" : "text-gray-600")} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className={cn("ml-4 font-medium", isActive ? "text-primary" : theme === "dark" ? "text-gray-200" : "text-gray-800")}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto", transition: { delay: 0.1 } }}
              exit={{ opacity: 0, width: 0 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )
}

const CollapsibleNavItem: React.FC<CollapsibleNavItemProps> = ({ href, icon: Icon, label, isCollapsed, submenu, isOpen, toggle }) => {
  const { pathname } = useLocation()
  const isActive = pathname.startsWith(href)
  const { theme } = useTheme()

  return (
    <div>
      <motion.div
        className={cn(
          "flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors text-sm",
          theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-200/50",
          isActive && (theme === "dark" ? "bg-primary/10 shadow-inner text-primary" : "bg-primary/10 shadow-inner text-primary")
        )}
        onClick={toggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : theme === "dark" ? "text-gray-400" : "text-gray-600")} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className={cn("ml-4 font-medium", isActive ? "text-primary" : theme === "dark" ? "text-gray-200" : "text-gray-800")}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto", transition: { delay: 0.1 } }}
              exit={{ opacity: 0, width: 0 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {!isCollapsed && (
          <ChevronRight className={cn("h-4 w-4 ml-auto transition-transform", isOpen && "rotate-90")} />
        )}
      </motion.div>
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-6 border-l border-gray-700/50 pl-2"
          >
            {submenu?.map((item) => (
              <NavItem key={item.href} {...item} isCollapsed={isCollapsed} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ isCollapsed, setCollapsed }: SidebarProps) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [openSubmenus, setOpenSubmenus] = React.useState<string[]>([])
  const { theme } = useTheme()
  const { user, signOut, role } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    const checkScreenWidth = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    checkScreenWidth()
    window.addEventListener("resize", checkScreenWidth)
    return () => window.removeEventListener("resize", checkScreenWidth)
  }, [])

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const UserProfileSection = () => (
    <div className="px-3 py-4 mt-auto">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    className={cn(
                        "p-2 rounded-lg cursor-pointer transition-colors flex items-center gap-3",
                        theme === 'dark' ? 'hover:bg-gray-800/60' : 'hover:bg-gray-200/60'
                    )}
                >
                    <Avatar className="h-10 w-10 border-2 border-primary/40">
                        {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ''} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/50 font-bold text-sm">
                            {getInitials(user?.displayName)}
                        </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="font-semibold text-sm truncate">{user?.displayName}</span>
                            <span className="text-xs text-muted-foreground capitalize">{role?.replace('_', ' ')}</span>
                        </div>
                    )}
                     {!isCollapsed && <MoreHorizontal className="h-5 w-5 text-muted-foreground" />}
                </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>{user?.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/settings">
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
        <div className={cn("flex items-center p-4 h-20", isCollapsed ? "justify-center" : "justify-start")}>
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}>
              <img src="/alandick_logo.png" alt="Logo" className={cn("transition-all", isCollapsed ? "h-12 w-12" : "h-16 w-auto")} />
            </motion.div>
        </div>

      <nav className="flex-1 px-3 py-4">
        {navItems.map((item) =>
          item.submenu ? (
            <CollapsibleNavItem
              key={item.href}
              {...item}
              isCollapsed={isCollapsed && !isMobile}
              isOpen={openSubmenus.includes(item.label)}
              toggle={() => toggleSubmenu(item.label)}
            />
          ) : (
            <NavItem key={item.href} {...item} isCollapsed={isCollapsed && !isMobile} />
          )
        )}
      </nav>
      <UserProfileSection />
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={!isCollapsed} onOpenChange={setCollapsed}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-20 bg-background/50 backdrop-blur-sm">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={cn("p-0 w-64 shadow-xl", theme === "dark" ? "bg-gray-900/70 backdrop-blur-lg border-r-gray-700/50" : "bg-white/70 backdrop-blur-lg border-r-gray-200/50")}>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <motion.div
      className={cn("h-screen hidden md:flex flex-col fixed left-0 top-0 shadow-xl", theme === "dark" ? "bg-gray-900/70 backdrop-blur-lg border-r-gray-700/50" : "bg-white/70 backdrop-blur-lg border-r-gray-200/50")}
      animate={{ width: isCollapsed ? 96 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!isCollapsed)}
        className={cn("absolute -right-4 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8", theme === "dark" ? "bg-gray-800/80 hover:bg-gray-700/80" : "bg-white/80 hover:bg-gray-100/80 shadow-md")}
      >
        <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
      </Button>
      <SidebarContent />
    </motion.div>
  )
}
