import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function AdminLayout({ children, title, subtitle, onRefresh }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title={title} subtitle={subtitle} onRefresh={onRefresh} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
