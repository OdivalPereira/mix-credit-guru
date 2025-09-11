import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Calculator, 
  Package, 
  Calendar, 
  BookOpen, 
  FileText, 
  Settings 
} from "lucide-react";

const navigation = [
  { name: 'Cotação', href: '/', icon: Calculator },
  { name: 'Catálogo', href: '/catalogo', icon: Package },
  { name: 'Cenários', href: '/cenarios', icon: Calendar },
  { name: 'Regras', href: '/regras', icon: BookOpen },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Config', href: '/config', icon: Settings },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Compras Mix Optimizer
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}