import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import DonationModal from "./components/DonationModal";
import { GlossaryProvider } from "@/contexts/GlossaryContext";
import { ActiveGlossary } from "@/components/ActiveGlossary";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const MeusDados = lazy(() => import("./pages/MeusDados"));
const Cotacao = lazy(() => import("./pages/Cotacao"));
const Analise = lazy(() => import("./pages/Analise"));
const Config = lazy(() => import("./pages/Config"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

// Legacy pages (manter temporariamente para compatibilidade)
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Cadastros = lazy(() => import("./pages/Cadastros"));
const Cenarios = lazy(() => import("./pages/Cenarios"));
const Regras = lazy(() => import("./pages/Regras"));
const ImpactoReforma = lazy(() => import("./pages/ImpactoReforma"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const FornecedoresContratos = lazy(() => import("./pages/FornecedoresContratos"));
const UnidadesConversoes = lazy(() => import("./pages/UnidadesConversoes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <GlossaryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DonationModal />
            <ActiveGlossary />
            <BrowserRouter>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-pulse text-muted-foreground">Carregando...</div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Index />} />
                    <Route path="meus-dados" element={<MeusDados />} />
                    <Route path="cotacao" element={<Cotacao />} />
                    <Route path="analise" element={<Analise />} />
                    <Route path="config" element={<Config />} />
                    <Route path="admin" element={<AdminPanel />} />

                    {/* Rotas legadas (redirecionar ou manter temporariamente) */}
                    <Route path="catalogo" element={<Catalogo />} />
                    <Route path="cadastros" element={<Cadastros />} />
                    <Route path="cenarios" element={<Cenarios />} />
                    <Route path="regras" element={<Regras />} />
                    <Route path="impacto-reforma" element={<ImpactoReforma />} />
                    <Route path="relatorios" element={<Relatorios />} />
                    <Route path="fornecedores-contratos" element={<FornecedoresContratos />} />
                    <Route path="unidades-conversoes" element={<UnidadesConversoes />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </GlossaryProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
