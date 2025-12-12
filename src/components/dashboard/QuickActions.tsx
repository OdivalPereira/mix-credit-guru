import { Calculator, FileText, Users, Settings, BarChart3, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Nova Cotação",
    description: "Inicie uma nova cotação de fornecedores",
    icon: Calculator,
    href: "/cotacao",
    gradient: "from-primary/20 to-primary/5",
    iconColor: "hsl(var(--primary))",
    glowColor: "hsl(var(--primary) / 0.3)",
  },
  {
    title: "Cadastrar Produtos",
    description: "Adicione produtos ao catálogo",
    icon: FileText,
    href: "/catalogo",
    gradient: "from-success/20 to-success/5",
    iconColor: "hsl(var(--success))",
    glowColor: "hsl(var(--success) / 0.3)",
  },
  {
    title: "Gerenciar Fornecedores",
    description: "Cadastre e edite fornecedores",
    icon: Users,
    href: "/fornecedores-contratos",
    gradient: "from-accent/20 to-accent/5",
    iconColor: "hsl(var(--accent))",
    glowColor: "hsl(var(--accent) / 0.3)",
  },
  {
    title: "Ver Análises",
    description: "Visualize comparações e análises",
    icon: BarChart3,
    href: "/analise",
    gradient: "from-warning/20 to-warning/5",
    iconColor: "hsl(var(--warning))",
    glowColor: "hsl(var(--warning) / 0.3)",
  },
  {
    title: "Configurar Regras",
    description: "Configure alíquotas e regras fiscais",
    icon: Settings,
    href: "/regras",
    gradient: "from-chart-5/20 to-chart-5/5",
    iconColor: "hsl(var(--chart-5))",
    glowColor: "hsl(var(--chart-5) / 0.3)",
  },
  {
    title: "Guia Completo",
    description: "Acesse a documentação do sistema",
    icon: BookOpen,
    href: "/config",
    gradient: "from-muted/20 to-muted/5",
    iconColor: "hsl(var(--muted-foreground))",
    glowColor: "hsl(var(--muted) / 0.3)",
  },
];

export function QuickActions() {
  return (
    <Card className="relative overflow-hidden border-border/50 backdrop-blur-sm" data-tour="quick-actions">
      {/* Decorative blur effect */}
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <CardTitle className="text-2xl">Ações Rápidas</CardTitle>
        <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="group"
            >
              <div 
                className={cn(
                  "relative p-6 rounded-xl border border-border/50 transition-all duration-300",
                  "hover:shadow-elegant hover:scale-[1.02] hover:border-primary/50",
                  "bg-gradient-to-br backdrop-blur-sm",
                  action.gradient
                )}
                style={{
                  boxShadow: `0 0 0 0 ${action.glowColor}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 40px ${action.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 0 ${action.glowColor}`;
                }}
              >
                <div 
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                    "transition-all duration-300 group-hover:scale-110 backdrop-blur-sm",
                    "shadow-lg group-hover:shadow-xl"
                  )}
                  style={{ 
                    backgroundColor: `${action.iconColor}15`,
                    color: action.iconColor
                  }}
                >
                  <action.icon className="w-7 h-7" />
                </div>
                
                <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
