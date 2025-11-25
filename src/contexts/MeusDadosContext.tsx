import { createContext, useContext, useState, ReactNode } from "react";

interface MeusDadosContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  advancedMode: boolean;
  setAdvancedMode: (mode: boolean) => void;
}

const MeusDadosContext = createContext<MeusDadosContextType | undefined>(undefined);

export function MeusDadosProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);

  return (
    <MeusDadosContext.Provider value={{ searchTerm, setSearchTerm, advancedMode, setAdvancedMode }}>
      {children}
    </MeusDadosContext.Provider>
  );
}

export function useMeusDados() {
  const context = useContext(MeusDadosContext);
  if (context === undefined) {
    throw new Error("useMeusDados must be used within a MeusDadosProvider");
  }
  return context;
}
