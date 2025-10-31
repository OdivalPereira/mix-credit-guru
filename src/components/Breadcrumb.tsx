import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeMap: Record<string, string> = {
  "/": "Início",
  "/cotacao": "Cotação",
  "/cadastros": "Cadastros",
  "/catalogo": "Catálogo",
  "/cenarios": "Cenários",
  "/regras": "Regras",
  "/impacto-reforma": "Impacto da Reforma",
  "/relatorios": "Relatórios",
  "/config": "Configurações",
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Início", path: "/" },
  ];

  let currentPath = "";
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeMap[currentPath] || segment;
    breadcrumbs.push({ label, path: currentPath });
  });

  if (breadcrumbs.length === 1) {
    return null; // Don't show breadcrumb on home page
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className={cn(
                    "hover:text-foreground transition-colors flex items-center gap-1",
                    isFirst && "hover:underline"
                  )}
                >
                  {isFirst && <Home className="h-4 w-4" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
