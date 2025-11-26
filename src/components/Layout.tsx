import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Calculator,
  Settings,
  Home,
  Heart,
  FolderOpen,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Glossary } from "@/components/Glossary";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { useDonationModalStore } from "@/store/useDonationModalStore";

const navigation = [
  { name: "Início", href: "/", icon: Home },
  { name: "Meus Dados", href: "/meus-dados", icon: FolderOpen },
  { name: "Cotação", href: "/cotacao", icon: Calculator },
  { name: "Análise", href: "/analise", icon: BarChart3 },
  { name: "Configurações", href: "/config", icon: Settings },
];

/**
 * @description Renderiza o layout principal da aplicação, incluindo o cabeçalho, a navegação e a área de conteúdo principal.
 * @returns O componente de layout.
 */
export function Layout() {
  const location = useLocation();
  const { openModal } = useDonationModalStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="border-b border-border/50 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm shadow-card">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Mix Credit Guru
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Tax Optimization Platform</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openModal}
            className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Apoiar</span>
          </Button>
        </div>
      </header>

      {/* Premium Navigation */}
      <nav className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105",
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <Outlet />
      </main>
      <Glossary />
    </div>
  );
}
