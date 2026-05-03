import { Link, useLocation } from "wouter";
import { Search, Users, LayoutDashboard, Calendar, History, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Pipeline", href: "/pipeline", icon: Activity },
  { name: "Follow Ups", href: "/followups", icon: Calendar },
  { name: "New Search", href: "/search", icon: Search },
  { name: "Search History", href: "/searches", icon: History },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="flex h-16 items-center px-4 border-b border-sidebar-border gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">LeadHunter Pro</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <span
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-sidebar-foreground/70")} />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
