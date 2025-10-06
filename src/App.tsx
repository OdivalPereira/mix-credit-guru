import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import DonationModal from "./components/DonationModal";

// Lazy load pages for code splitting
const Cotacao = lazy(() => import("./pages/Cotacao"));
const Catalogo = lazy(() => import("./pages/Catalogo"));
const Cenarios = lazy(() => import("./pages/Cenarios"));
const Regras = lazy(() => import("./pages/Regras"));
const Receitas = lazy(() => import("./pages/Receitas"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Config = lazy(() => import("./pages/Config"));
const CompararCenarios = lazy(() => import("./pages/CompararCenarios"));
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DonationModal />
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Cotacao />} />
                <Route path="catalogo" element={<Catalogo />} />
                <Route path="cenarios" element={<Cenarios />} />
              <Route path="regras" element={<Regras />} />
              <Route path="receitas" element={<Receitas />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="comparar-cenarios" element={<CompararCenarios />} />
              <Route path="contratos" element={<FornecedoresContratos />} />
              <Route path="unidades" element={<UnidadesConversoes />} />
              <Route path="config" element={<Config />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
