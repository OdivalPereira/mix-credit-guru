import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import DonationModal from "./components/DonationModal";
import Cotacao from "./pages/Cotacao";
import Catalogo from "./pages/Catalogo";
import Cenarios from "./pages/Cenarios";
import Regras from "./pages/Regras";
import Relatorios from "./pages/Relatorios";
import Config from "./pages/Config";

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
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Cotacao />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route path="cenarios" element={<Cenarios />} />
              <Route path="regras" element={<Regras />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="config" element={<Config />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
