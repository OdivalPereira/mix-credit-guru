import { useAuth } from "@/contexts/AuthContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthGateProps {
    children: React.ReactNode;
    /**
     * Description of the feature being accessed (e.g., "adicionar fornecedores").
     */
    feature?: string;
    /**
     * Only use this if you want to wrap a trigger directly.
     * If false, the gate is open.
     */
    restricted?: boolean;
}

export function AuthGate({ children, feature = "usar este recurso", restricted = true }: AuthGateProps) {
    const { isDemo } = useAuth();
    const navigate = useNavigate();

    // If not demo or not restricted, allow access
    if (!isDemo || !restricted) {
        return <>{children}</>;
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {/* We wrap children in a span so click events bubble up to Trigger if child is a button */}
                <span onClick={(e) => e.stopPropagation()}>
                    {children}
                </span>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Modo Demonstração</AlertDialogTitle>
                    <AlertDialogDescription>
                        Você está usando a versão de demonstração.
                        Para {feature}, é necessário criar uma conta gratuita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Continuar testando</AlertDialogCancel>
                    <AlertDialogAction onClick={() => navigate("/auth?view=signup")}>
                        Criar Conta
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
