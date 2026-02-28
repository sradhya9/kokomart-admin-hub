import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Products & Pricing", path: "/products" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

export function Sidebar() {
  const location = useLocation();
  const { logOut, user } = useAuth();

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "AD";
  const userEmail = user?.email ?? "";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-sidebar shadow-2xl flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden ring-2 ring-sidebar-primary/30">
          <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">Meat Up</h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/60">
          Navigation
        </p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-item group",
                isActive ? "sidebar-item-active" : "sidebar-item-inactive"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                isActive ? "bg-sidebar-primary/20" : "bg-transparent group-hover:bg-sidebar-accent"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-sidebar-border p-4 space-y-3">

        {/* Logout button */}
        <button
          className="sidebar-item sidebar-item-inactive w-full text-red-400/80 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          onClick={async () => {
            try {
              await logOut();
            } catch (e) {
              console.error('Logout error:', e);
            }
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-900/20">
            <LogOut className="h-4 w-4" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
