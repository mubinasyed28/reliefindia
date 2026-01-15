import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import reliefxLogo from "@/assets/reliefx-logo.png";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  navItems: NavItem[];
  role: string;
}

export function DashboardLayout({ children, title, navItems, role }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Sidebar header with RELIFEX logo */}
          <div className="p-4 border-b bg-navy-dark text-white">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <img 
                  src={reliefxLogo} 
                  alt="RELIFEX" 
                  className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <div>
                  <span className="font-bold block text-lg tracking-wide">RELIFEX</span>
                  <span className="text-xs text-white/70 capitalize">{role} Command</span>
                </div>
              </Link>
              <button 
                className="lg:hidden text-white hover:bg-white/10 p-1 rounded transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t space-y-2">
            <div className="flex justify-center mb-2">
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 btn-hover hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-card border-b px-4 py-3 flex items-center gap-4 animate-fade-in">
          <button 
            className="lg:hidden p-2 -ml-2 hover:bg-muted rounded-md transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
