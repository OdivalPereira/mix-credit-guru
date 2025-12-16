import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calculator,
  Settings,
  Home,
  Heart,
  FolderOpen,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  History,
  FlaskConical,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Glossary } from "@/components/Glossary";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { useDonationModalStore } from "@/store/useDonationModalStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Início", href: "/", icon: Home },
  { name: "Cadastros", href: "/cadastros", icon: FolderOpen },
  { name: "Cotação", href: "/cotacao", icon: Calculator },
  { name: "Análise", href: "/analise", icon: BarChart3 },
  { name: "Histórico", href: "/historico", icon: History },
  { name: "Configurações", href: "/config", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useDonationModalStore();
  const { theme, setTheme } = useTheme();
  const { user, profile, isAdmin, isDemo, signOut } = useAuth();
  
  const isDarkMode = theme === "dark";
  
  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="border-b border-border/50 bg-gradient-to-r from-card to-card/50 backdrop-blur-sm shadow-card">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3" data-tour="logo">
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative h-9 w-9 rounded-xl hover:bg-muted transition-all"
              aria-label="Toggle theme"
              data-tour="theme-toggle"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openModal}
              className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Apoiar</span>
            </Button>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/config" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="text-sm font-medium">
                Modo Demonstração — Os dados não serão salvos.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-white hover:bg-white/20 hover:text-white"
                onClick={() => navigate('/auth')}
              >
                Criar conta
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                onClick={signOut}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Navigation */}
      <nav className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
            const tourId = item.href === '/cadastros' ? 'nav-cadastros' 
              : item.href === '/cotacao' ? 'nav-cotacao'
              : item.href === '/analise' ? 'nav-analise'
              : undefined;
            return (
              <Link
                key={item.href}
                to={item.href}
                data-tour={tourId}
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
