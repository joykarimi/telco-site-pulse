
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
} from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { PERMISSIONS } from "@/lib/roles"

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
  { href: "/settings", icon: Settings, label: "Settings" },
];

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, isCollapsed }) => {
  const { pathname } = useLocation()
  const isActive = pathname === href
  const { theme } = useTheme()

  return (
    <Link to={href}>
      <motion.div
        className={cn(
          "flex items-center p-3 my-2 rounded-lg cursor-pointer transition-colors",
          theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-200/50",
          isActive && (theme === "dark" ? "bg-gray-700/80 shadow-md" : "bg-gray-200/80 shadow-md")
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className={cn("h-6 w-6", theme === "dark" ? "text-gray-200" : "text-gray-800")} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className={cn("ml-4 font-medium", theme === "dark" ? "text-gray-200" : "text-gray-800")}
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
          "flex items-center p-3 my-2 rounded-lg cursor-pointer transition-colors",
          theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-200/50",
          isActive && (theme === "dark" ? "bg-gray-700/80 shadow-md" : "bg-gray-200/80 shadow-md")
        )}
        onClick={toggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className={cn("h-6 w-6", theme === "dark" ? "text-gray-200" : "text-gray-800")} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              className={cn("ml-4 font-medium", theme === "dark" ? "text-gray-200" : "text-gray-800")}
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
            className="ml-4"
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

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [openSubmenus, setOpenSubmenus] = React.useState<string[]>([])
  const { theme } = useTheme()

  React.useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth < 768)
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ duration: 0.5 }}>
          <img src="/alandick_logo.png" alt="Logo" className="h-16 w-16" />
        </motion.div>
      </div>

      <nav className="flex-1 px-4">
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

    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={cn("p-0 w-64 shadow-lg", theme === "dark" ? "bg-gray-900/50 backdrop-blur-lg border-r border-gray-700/50" : "bg-white/50 backdrop-blur-lg border-r border-gray-200/50")}>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <motion.div
      className={cn("h-screen fixed left-0 top-0 shadow-lg rounded-r-2xl flex flex-col", theme === "dark" ? "bg-gray-900/50 backdrop-blur-lg border-r border-gray-700/50" : "bg-white/50 backdrop-blur-lg border-r border-gray-200/50")}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn("absolute -right-4 top-16 z-10", theme === "dark" ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-white/50 hover:bg-gray-100/50")}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180", theme === "dark" ? "text-gray-200" : "text-gray-800")} />
      </Button>
      <SidebarContent />
    </motion.div>
  )
}
