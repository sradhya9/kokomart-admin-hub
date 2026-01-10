import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Percent,
  BarChart3,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Package, label: "Products & Pricing", path: "/products" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
  { icon: Users, label: "Users", path: "/users" },
  /*{ icon: Percent, label: "Discounts & Offers", path: "/discounts" },*/
  { icon: BarChart3, label: "Reports", path: "/reports" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-sidebar shadow-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white overflow-hidden">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">KoKoMart</h1>
            <p className="text-xs text-sidebar-muted">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "sidebar-item group",
                      isActive ? "sidebar-item-active" : "sidebar-item-inactive"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <button className="sidebar-item sidebar-item-inactive w-full text-red-400 hover:bg-red-500/10 hover:text-red-400">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
