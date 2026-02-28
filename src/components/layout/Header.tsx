import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function Header({ title, subtitle, onRefresh }: HeaderProps) {
  const { user } = useAuth();
  const userEmail = user?.email ?? "";
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-md"
      style={{ borderColor: 'hsl(var(--border))' }}>
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-56 pl-9 h-9 bg-background border-border/60 text-sm focus-visible:ring-primary/40 rounded-xl"
          />
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Profile */}
        <div className="flex items-center gap-2.5 rounded-xl bg-secondary/60 border border-border/50 px-3 py-1.5">
          <Avatar className="h-7 w-7 ring-2 ring-primary/20">
            <AvatarImage src="/logo.png" alt="Admin" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-tight">Admin</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
