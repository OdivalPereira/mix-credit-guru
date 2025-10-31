import { Outlet, Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Calculator,
  FileText,
  Settings,
  ClipboardList,
  Home,
  TrendingUp,
  Heart,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Glossary } from "@/components/Glossary";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { useDonationModalStore } from "@/store/useDonationModalStore";

const navigation = [
  { name: "Início", href: "/", icon: Home },
  { name: "Cotação", href: "/cotacao", icon: Calculator },
  { name: "Cadastros", href: "/cadastros", icon: ClipboardList },
  { name: "Cenários", href: "/cenarios", icon: Calendar },
  { name: "Regras", href: "/regras", icon: BookOpen },
  { name: "Impacto da Reforma", href: "/impacto-reforma", icon: TrendingUp },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Config", href: "/config", icon: Settings },
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
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">
            Mix Credit Guru
          </h1>
          <Button variant="outline" size="sm" onClick={openModal}>
            <Heart className="mr-2 h-4 w-4" />
            Apoiar
          </Button>
        </div>
      </header>

      <nav className="border-b border-border bg-card">
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
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
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
